const axios = require('axios');
const db = require('../database/db');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class MoneyGramService {
  constructor() {
    this.apiKey = process.env.MONEYGRAM_API_KEY;
    this.apiSecret = process.env.MONEYGRAM_API_SECRET;
    this.baseUrl = process.env.MONEYGRAM_API_URL || 'https://api.moneygram.com/api/v1';
    this.sandboxMode = process.env.NODE_ENV !== 'production';
  }

  /**
   * Initialize cash-out transaction
   * @param {object} params - Cash-out parameters
   * @returns {object} Transaction object
   */
  async initiateCashOut(params) {
    const {
      sender_stellar_account,
      sender_name,
      sender_country,
      sender_phone,
      receiver_name,
      receiver_country,
      receiver_id_type,
      receiver_id_number,
      crypto_amount,
      crypto_currency,
      fiat_currency,
      payout_method = 'cash_pickup',
      payout_location_id,
    } = params;

    try {
      // Get current exchange rate
      const exchangeRate = await this.getExchangeRate(crypto_currency, fiat_currency);

      if (!exchangeRate) {
        throw new Error(`Exchange rate not available for ${crypto_currency}/${fiat_currency}`);
      }

      // Calculate fiat amount and fees
      const fiatAmount = (parseFloat(crypto_amount) * parseFloat(exchangeRate.rate)).toFixed(2);
      const serviceFee = (parseFloat(fiatAmount) * (exchangeRate.fee_percentage / 100)).toFixed(2);
      const totalFee = serviceFee;
      const netAmount = (parseFloat(fiatAmount) - parseFloat(totalFee)).toFixed(2);

      // Generate unique reference
      const moneygramReference = `MG${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create transaction record
      const result = await db.query(
        `INSERT INTO moneygram_transactions (
          moneygram_reference, stellar_transaction_id,
          sender_stellar_account, sender_name, sender_country, sender_phone,
          receiver_name, receiver_country, receiver_id_type, receiver_id_number,
          crypto_amount, crypto_currency, fiat_amount, fiat_currency,
          exchange_rate, service_fee, total_fee,
          payout_method, payout_location_id,
          kyc_verified, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *`,
        [
          moneygramReference,
          null, // Will be set when Stellar transaction completes
          sender_stellar_account,
          sender_name,
          sender_country,
          sender_phone,
          receiver_name,
          receiver_country,
          receiver_id_type,
          receiver_id_number,
          crypto_amount,
          crypto_currency,
          netAmount,
          fiat_currency,
          exchangeRate.rate,
          serviceFee,
          totalFee,
          payout_method,
          payout_location_id,
          false,
          'pending',
        ]
      );

      logger.audit('MoneyGram cash-out initiated', {
        reference: moneygramReference,
        sender: sender_stellar_account,
        amount: crypto_amount,
        fiat_amount: netAmount,
        currency: fiat_currency,
      });

      const transaction = result.rows[0];

      // In production, call MoneyGram API to create order
      // const moneygramOrder = await this.createMoneyGramOrder(transaction);

      return {
        success: true,
        transaction_id: transaction.id,
        moneygram_reference: transaction.moneygram_reference,
        status: transaction.status,
        crypto_amount: transaction.crypto_amount,
        fiat_amount: transaction.fiat_amount,
        fiat_currency: transaction.fiat_currency,
        exchange_rate: transaction.exchange_rate,
        fee: transaction.total_fee,
        expires_at: transaction.expires_at,
      };
    } catch (error) {
      logger.error('Failed to initiate MoneyGram cash-out', error);
      throw error;
    }
  }

  /**
   * Get cash-out transaction status
   * @param {string} reference - MoneyGram reference
   * @returns {object} Transaction details
   */
  async getCashOutStatus(reference) {
    try {
      const result = await db.query(
        'SELECT * FROM moneygram_transactions WHERE moneygram_reference = $1',
        [reference]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatTransaction(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get cash-out status', error);
      throw error;
    }
  }

  /**
   * Get all cash-out transactions for a user
   * @param {string} stellarAccount - Stellar account
   * @param {number} limit - Number of transactions
   * @returns {array} List of transactions
   */
  async getUserTransactions(stellarAccount, limit = 20) {
    try {
      const result = await db.query(
        `SELECT * FROM moneygram_transactions 
         WHERE sender_stellar_account = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [stellarAccount, limit]
      );

      return result.rows.map(tx => this.formatTransaction(tx));
    } catch (error) {
      logger.error('Failed to get user transactions', error);
      throw error;
    }
  }

  /**
   * Get exchange rate for currency pair
   * @param {string} baseCurrency - Base currency (USDC)
   * @param {string} targetCurrency - Target currency (MXN, INR, etc.)
   * @returns {object} Exchange rate
   */
  async getExchangeRate(baseCurrency, targetCurrency) {
    try {
      // Check cache first
      const cached = await db.query(
        `SELECT * FROM exchange_rates 
         WHERE base_currency = $1 AND target_currency = $2 
         AND valid_until > NOW()`,
        [baseCurrency, targetCurrency]
      );

      if (cached.rows.length > 0) {
        return cached.rows[0];
      }

      // Fetch from MoneyGram API (or external provider)
      const rate = await this.fetchExchangeRateFromAPI(baseCurrency, targetCurrency);

      // Cache it
      await db.query(
        `INSERT INTO exchange_rates (base_currency, target_currency, rate, fee_percentage, source, valid_until)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '5 minutes')
         ON CONFLICT (base_currency, target_currency) 
         DO UPDATE SET rate = $3, fee_percentage = $4, valid_until = NOW() + INTERVAL '5 minutes'`,
        [baseCurrency, targetCurrency, rate.rate, rate.fee_percentage, 'moneygram']
      );

      return rate;
    } catch (error) {
      logger.error('Failed to get exchange rate', error);
      return null;
    }
  }

  /**
   * Find nearby MoneyGram locations
   * @param {object} params - Search parameters
   * @returns {array} List of locations
   */
  async findLocations(params) {
    const { country, city, latitude, longitude, radius_km = 10 } = params;

    try {
      let query = `SELECT * FROM moneygram_locations WHERE is_active = TRUE`;
      const values = [];
      let paramIndex = 1;

      if (country) {
        query += ` AND country = $${paramIndex}`;
        values.push(country);
        paramIndex++;
      }

      if (city) {
        query += ` AND city = $${paramIndex}`;
        values.push(city);
        paramIndex++;
      }

      query += ` ORDER BY distance_km ASC LIMIT 50`;

      const result = await db.query(query, values);

      // If coordinates provided, calculate distances
      if (latitude && longitude) {
        return result.rows.map(location => {
          const distance = this.calculateDistance(
            latitude, longitude,
            parseFloat(location.latitude),
            parseFloat(location.longitude)
          );
          return { ...location, distance_km: distance.toFixed(2) };
        }).sort((a, b) => a.distance_km - b.distance_km);
      }

      return result.rows;
    } catch (error) {
      logger.error('Failed to find locations', error);
      throw error;
    }
  }

  /**
   * Process crypto payment for cash-out
   * Called after user sends USDC to escrow
   * @param {string} reference - MoneyGram reference
   * @param {string} stellarTxId - Stellar transaction ID
   */
  async processCryptoPayment(reference, stellarTxId) {
    try {
      const result = await db.query(
        `UPDATE moneygram_transactions 
         SET stellar_transaction_id = $2,
             status = 'processing',
             updated_at = CURRENT_TIMESTAMP
         WHERE moneygram_reference = $1
         RETURNING *`,
        [reference, stellarTxId]
      );

      if (result.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      logger.audit('MoneyGram crypto payment processed', {
        reference,
        stellar_tx_id: stellarTxId,
      });

      // In production, notify MoneyGram API
      // await this.notifyPaymentReceived(result.rows[0]);

      return this.formatTransaction(result.rows[0]);
    } catch (error) {
      logger.error('Failed to process crypto payment', error);
      throw error;
    }
  }

  /**
   * Mark cash-out as ready for pickup
   * @param {string} reference - MoneyGram reference
   * @param {object} pickupDetails - Pickup details
   */
  async markReadyForPickup(reference, pickupDetails) {
    try {
      const { tracking_number, pin_code, expires_at } = pickupDetails;

      // Encrypt PIN code
      const encryptedPin = this.encryptPin(pin_code);

      const result = await db.query(
        `UPDATE moneygram_transactions 
         SET status = 'ready_for_pickup',
             tracking_number = $2,
             pin_code = $3,
             expires_at = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE moneygram_reference = $1
         RETURNING *`,
        [reference, tracking_number, encryptedPin, expires_at]
      );

      logger.audit('MoneyGram cash-out ready for pickup', {
        reference,
        tracking_number,
      });

      // Trigger webhook
      await this.triggerWebhook('cashout.ready_for_pickup', result.rows[0]);

      return this.formatTransaction(result.rows[0]);
    } catch (error) {
      logger.error('Failed to mark ready for pickup', error);
      throw error;
    }
  }

  /**
   * Complete cash-out transaction
   * @param {string} reference - MoneyGram reference
   */
  async completeCashOut(reference) {
    try {
      const result = await db.query(
        `UPDATE moneygram_transactions 
         SET status = 'picked_up',
             completed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE moneygram_reference = $1
         RETURNING *`,
        [reference]
      );

      logger.audit('MoneyGram cash-out completed', {
        reference,
      });

      await this.triggerWebhook('cashout.completed', result.rows[0]);

      return this.formatTransaction(result.rows[0]);
    } catch (error) {
      logger.error('Failed to complete cash-out', error);
      throw error;
    }
  }

  /**
   * Fetch exchange rate from API
   * @param {string} baseCurrency - Base currency
   * @param {string} targetCurrency - Target currency
   * @returns {object} Exchange rate
   */
  async fetchExchangeRateFromAPI(baseCurrency, targetCurrency) {
    try {
      // In production, call MoneyGram API or external rate provider
      // For now, return mock rates
      const mockRates = {
        'USDC_MXN': { rate: '17.50', fee_percentage: 2.5 },
        'USDC_INR': { rate: '83.20', fee_percentage: 2.0 },
        'USDC_PHP': { rate: '56.30', fee_percentage: 2.5 },
        'USDC_GHS': { rate: '12.80', fee_percentage: 3.0 },
        'USDC_NGN': { rate: '1550.00', fee_percentage: 3.5 },
      };

      const key = `${baseCurrency}_${targetCurrency}`;
      
      if (mockRates[key]) {
        return {
          base_currency: baseCurrency,
          target_currency: targetCurrency,
          rate: mockRates[key].rate,
          fee_percentage: mockRates[key].fee_percentage,
          source: 'mock',
          valid_until: new Date(Date.now() + 5 * 60 * 1000),
        };
      }

      // Default fallback
      return {
        base_currency: baseCurrency,
        target_currency: targetCurrency,
        rate: '1.00',
        fee_percentage: 3.0,
        source: 'default',
        valid_until: new Date(Date.now() + 5 * 60 * 1000),
      };
    } catch (error) {
      logger.error('Failed to fetch exchange rate from API', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Encrypt PIN code for secure storage
   */
  encryptPin(pin) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.PIN_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(pin, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt PIN code
   */
  decryptPin(encryptedPin) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.PIN_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const [ivHex, encrypted] = encryptedPin.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Format transaction for API response
   */
  formatTransaction(tx) {
    return {
      id: tx.id,
      moneygram_reference: tx.moneygram_reference,
      stellar_transaction_id: tx.stellar_transaction_id,
      status: tx.status,
      crypto_amount: tx.crypto_amount,
      crypto_currency: tx.crypto_currency,
      fiat_amount: tx.fiat_amount,
      fiat_currency: tx.fiat_currency,
      exchange_rate: tx.exchange_rate,
      fee: tx.total_fee,
      sender_name: tx.sender_name,
      receiver_name: tx.receiver_name,
      payout_method: tx.payout_method,
      payout_location_name: tx.payout_location_name,
      payout_city: tx.payout_city,
      payout_country: tx.payout_country,
      tracking_number: tx.tracking_number,
      created_at: tx.created_at?.toISOString(),
      updated_at: tx.updated_at?.toISOString(),
      completed_at: tx.completed_at?.toISOString(),
      expires_at: tx.expires_at?.toISOString(),
      message: tx.message,
    };
  }

  /**
   * Trigger webhook for cash-out event
   */
  async triggerWebhook(eventType, transaction) {
    try {
      const webhooks = await db.query(
        `SELECT * FROM webhook_subscriptions 
         WHERE active = TRUE AND $1 = ANY(event_types)`,
        [eventType]
      );

      for (const webhook of webhooks.rows) {
        await db.query(
          `INSERT INTO webhook_deliveries (webhook_id, event_type, payload)
           VALUES ($1, $2, $3)`,
          [webhook.id, eventType, JSON.stringify(transaction)]
        );
      }
    } catch (error) {
      logger.error('Failed to trigger webhook', error);
    }
  }
}

module.exports = new MoneyGramService();

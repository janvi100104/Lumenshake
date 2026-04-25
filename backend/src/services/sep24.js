const db = require('../database/db');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

class SEP24Service {
  /**
   * Initialize interactive transaction (POST /transactions/interactive)
   * @param {object} params - Transaction parameters
   * @returns {object} Transaction object with interactive URL
   */
  async createTransaction(params) {
    const {
      kind, // 'deposit' or 'withdrawal'
      asset_code,
      asset_issuer,
      stellar_account,
      external_account,
      amount,
      lang = 'en',
    } = params;

    try {
      // Generate unique transaction ID
      const transactionId = uuidv4();

      // Create transaction record
      const result = await db.query(
        `INSERT INTO sep24_transactions (
          transaction_id, kind, asset_code, asset_issuer,
          stellar_account, external_account, amount_expected,
          status, more_info_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          transactionId,
          kind,
          asset_code,
          asset_issuer,
          stellar_account,
          external_account,
          amount,
          'incomplete',
          `${process.env.ANCHOR_URL || 'http://localhost:4000'}/sep24/interactive/${transactionId}`,
        ]
      );

      logger.audit('SEP-24 transaction created', {
        transaction_id: transactionId,
        kind,
        stellar_account,
        amount,
      });

      const transaction = result.rows[0];

      return {
        id: transaction.transaction_id,
        kind: transaction.kind,
        status: transaction.status,
        more_info_url: transaction.more_info_url,
      };
    } catch (error) {
      logger.error('Failed to create SEP-24 transaction', error);
      throw error;
    }
  }

  /**
   * Get transaction status (GET /transaction)
   * @param {string} transactionId - Transaction ID
   * @returns {object} Transaction details
   */
  async getTransaction(transactionId) {
    try {
      const result = await db.query(
        'SELECT * FROM sep24_transactions WHERE transaction_id = $1',
        [transactionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatTransaction(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get SEP-24 transaction', error);
      throw error;
    }
  }

  /**
   * Get all transactions for an account (GET /transactions)
   * @param {string} stellarAccount - Stellar account address
   * @param {number} limit - Number of transactions to return
   * @returns {array} List of transactions
   */
  async getTransactions(stellarAccount, limit = 20) {
    try {
      const result = await db.query(
        `SELECT * FROM sep24_transactions 
         WHERE stellar_account = $1 
         ORDER BY started_at DESC 
         LIMIT $2`,
        [stellarAccount, limit]
      );

      return result.rows.map(tx => this.formatTransaction(tx));
    } catch (error) {
      logger.error('Failed to get SEP-24 transactions', error);
      throw error;
    }
  }

  /**
   * Update transaction status
   * @param {string} transactionId - Transaction ID
   * @param {string} status - New status
   * @param {object} updates - Additional updates
   * @returns {object} Updated transaction
   */
  async updateTransaction(transactionId, status, updates = {}) {
    try {
      const setClauses = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
      const values = [transactionId, status];
      let paramIndex = 3;

      // Add additional updates
      Object.keys(updates).forEach(key => {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      });

      // Add completed_at if status is completed
      if (status === 'completed') {
        setClauses.push('completed_at = CURRENT_TIMESTAMP');
      }

      const query = `UPDATE sep24_transactions 
                     SET ${setClauses.join(', ')} 
                     WHERE transaction_id = $1 
                     RETURNING *`;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      logger.audit('SEP-24 transaction updated', {
        transaction_id: transactionId,
        status,
      });

      // Trigger webhook
      await this.triggerWebhook('transaction.status_changed', result.rows[0]);

      return this.formatTransaction(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update SEP-24 transaction', error);
      throw error;
    }
  }

  /**
   * Generate interactive deposit URL
   * @param {string} transactionId - Transaction ID
   * @returns {string} Interactive URL
   */
  getInteractiveUrl(transactionId) {
    const baseUrl = process.env.ANCHOR_URL || 'http://localhost:4000';
    return `${baseUrl}/sep24/interactive/${transactionId}`;
  }

  /**
   * Format transaction for SEP-24 response
   */
  formatTransaction(tx) {
    return {
      id: tx.transaction_id,
      kind: tx.kind,
      status: tx.status,
      status_eta: this.calculateStatusEta(tx.status),
      amount_in: tx.amount_in,
      amount_out: tx.amount_out,
      amount_fee: tx.amount_fee,
      amount_expected: tx.amount_expected,
      start_time: tx.started_at.toISOString(),
      updated_at: tx.updated_at.toISOString(),
      completed_at: tx.completed_at?.toISOString(),
      stellar_account: tx.stellar_account,
      external_account: tx.external_account,
      more_info_url: tx.more_info_url,
      message: tx.message,
    };
  }

  /**
   * Estimate time to completion based on status
   */
  calculateStatusEta(status) {
    const etaMap = {
      'incomplete': null,
      'pending_user_transfer_start': null,
      'pending_user_transfer_complete': 60, // 1 minute
      'pending_external': 3600, // 1 hour
      'pending_anchor': 300, // 5 minutes
      'completed': 0,
      'error': null,
      'expired': null,
    };

    return etaMap[status] || null;
  }

  /**
   * Trigger webhook for transaction event
   */
  async triggerWebhook(eventType, transaction) {
    try {
      // Get active webhook subscriptions for this event
      const webhooks = await db.query(
        `SELECT * FROM webhook_subscriptions 
         WHERE active = TRUE AND $1 = ANY(event_types)`,
        [eventType]
      );

      // Queue webhook deliveries
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

module.exports = new SEP24Service();

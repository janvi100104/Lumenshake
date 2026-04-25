const db = require('../database/db');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

class SEP31Service {
  /**
   * Create send transaction (POST /transactions)
   * @param {object} params - Transaction parameters
   * @returns {object} Transaction object
   */
  async createSendTransaction(params) {
    const {
      amount,
      sell_asset,
      buy_asset,
      sender_account,
      sender_name,
      sender_country,
      receiver_account,
      receiver_name,
      receiver_country,
      receiver_external_account,
      fields,
    } = params;

    try {
      const transactionId = uuidv4();

      // Create transaction record
      const result = await db.query(
        `INSERT INTO sep31_transactions (
          stellar_transaction_id, sell_asset, buy_asset,
          sender_account, sender_name, sender_country,
          receiver_account, receiver_name, receiver_country,
          receiver_external_account, amount_expected, status,
          kyc_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          transactionId,
          sell_asset,
          buy_asset,
          sender_account,
          sender_name,
          sender_country,
          receiver_account,
          receiver_name,
          receiver_country,
          receiver_external_account,
          amount,
          'pending',
          false, // KYC will be verified separately
        ]
      );

      logger.audit('SEP-31 send transaction created', {
        transaction_id: transactionId,
        sender: sender_account,
        receiver: receiver_account,
        amount,
      });

      const transaction = result.rows[0];

      return {
        id: transaction.stellar_transaction_id,
        status: transaction.status,
        more_info_url: `${process.env.ANCHOR_URL || 'http://localhost:4000'}/sep31/transaction/${transaction.stellar_transaction_id}`,
      };
    } catch (error) {
      logger.error('Failed to create SEP-31 transaction', error);
      throw error;
    }
  }

  /**
   * Get transaction details (GET /transactions/:id)
   * @param {string} transactionId - Transaction ID
   * @returns {object} Transaction details
   */
  async getTransaction(transactionId) {
    try {
      const result = await db.query(
        'SELECT * FROM sep31_transactions WHERE stellar_transaction_id = $1',
        [transactionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatTransaction(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get SEP-31 transaction', error);
      throw error;
    }
  }

  /**
   * Get transactions for sender or receiver
   * @param {string} account - Stellar account
   * @param {number} limit - Number of transactions
   * @returns {array} List of transactions
   */
  async getTransactions(account, limit = 20) {
    try {
      const result = await db.query(
        `SELECT * FROM sep31_transactions 
         WHERE sender_account = $1 OR receiver_account = $1
         ORDER BY started_at DESC 
         LIMIT $2`,
        [account, limit]
      );

      return result.rows.map(tx => this.formatTransaction(tx));
    } catch (error) {
      logger.error('Failed to get SEP-31 transactions', error);
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

      Object.keys(updates).forEach(key => {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      });

      if (status === 'completed') {
        setClauses.push('completed_at = CURRENT_TIMESTAMP');
      }

      const query = `UPDATE sep31_transactions 
                     SET ${setClauses.join(', ')} 
                     WHERE stellar_transaction_id = $1 
                     RETURNING *`;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      logger.audit('SEP-31 transaction updated', {
        transaction_id: transactionId,
        status,
      });

      // Trigger webhook
      await this.triggerWebhook('sep31.transaction.status_changed', result.rows[0]);

      return this.formatTransaction(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update SEP-31 transaction', error);
      throw error;
    }
  }

  /**
   * Process compliance check for transaction
   * @param {string} transactionId - Transaction ID
   * @param {object} complianceData - KYC/AML compliance data
   * @returns {object} Compliance result
   */
  async processCompliance(transactionId, complianceData) {
    try {
      const transaction = await this.getTransaction(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Here you would integrate with actual KYC/AML provider
      // For now, we'll just mark as verified
      const result = await db.query(
        `UPDATE sep31_transactions 
         SET kyc_verified = $2, 
             compliance_response = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE stellar_transaction_id = $1
         RETURNING *`,
        [transactionId, true, JSON.stringify(complianceData)]
      );

      logger.audit('SEP-31 compliance processed', {
        transaction_id: transactionId,
        verified: true,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to process compliance', error);
      throw error;
    }
  }

  /**
   * Format transaction for SEP-31 response
   */
  formatTransaction(tx) {
    return {
      id: tx.stellar_transaction_id,
      status: tx.status,
      status_eta: this.calculateStatusEta(tx.status),
      amount_in: tx.amount_in,
      amount_out: tx.amount_out,
      amount_fee: tx.amount_fee,
      amount_expected: tx.amount_expected,
      sell_asset: tx.sell_asset,
      buy_asset: tx.buy_asset,
      sender_account: tx.sender_account,
      receiver_account: tx.receiver_account,
      started_at: tx.started_at?.toISOString(),
      updated_at: tx.updated_at?.toISOString(),
      completed_at: tx.completed_at?.toISOString(),
      deposit_memo: tx.deposit_memo,
      deposit_memo_type: tx.deposit_memo_type,
      withdraw_memo: tx.withdraw_memo,
      withdraw_memo_type: tx.withdraw_memo_type,
      more_info_url: tx.more_info_url,
      message: tx.message,
    };
  }

  /**
   * Estimate time to completion
   */
  calculateStatusEta(status) {
    const etaMap = {
      'pending': null,
      'pending_sender': null,
      'pending_stellar': 300, // 5 minutes
      'pending_receiver': 3600, // 1 hour
      'pending_external': 7200, // 2 hours
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

  /**
   * Reconcile transactions with blockchain
   * This would be run as a cron job
   */
  async reconcileTransactions() {
    try {
      logger.info('Starting SEP-31 transaction reconciliation');

      // Get pending transactions
      const pendingTransactions = await db.query(
        `SELECT * FROM sep31_transactions 
         WHERE status IN ('pending', 'pending_stellar', 'pending_receiver')
         AND started_at > NOW() - INTERVAL '24 hours'`
      );

      for (const tx of pendingTransactions.rows) {
        // Here you would check Stellar blockchain for actual transaction status
        // For now, we'll just log
        logger.info(`Reconciling transaction ${tx.stellar_transaction_id}`);
      }

      logger.info(`Reconciled ${pendingTransactions.rows.length} transactions`);
    } catch (error) {
      logger.error('Failed to reconcile transactions', error);
    }
  }
}

module.exports = new SEP31Service();

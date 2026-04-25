const axios = require('axios');
const crypto = require('crypto');
const db = require('../database/db');
const logger = require('./logger');

class WebhookService {
  /**
   * Register webhook subscription
   * @param {object} params - Webhook parameters
   * @returns {object} Webhook subscription
   */
  async subscribe(params) {
    const { url, event_types, secret } = params;

    try {
      const result = await db.query(
        `INSERT INTO webhook_subscriptions (url, event_types, secret)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [url, event_types, secret || crypto.randomBytes(32).toString('hex')]
      );

      logger.audit('Webhook subscription created', {
        url,
        event_types,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create webhook subscription', error);
      throw error;
    }
  }

  /**
   * Get webhook subscriptions
   * @returns {array} List of webhook subscriptions
   */
  async getSubscriptions() {
    try {
      const result = await db.query(
        'SELECT * FROM webhook_subscriptions ORDER BY created_at DESC'
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get webhook subscriptions', error);
      throw error;
    }
  }

  /**
   * Delete webhook subscription
   * @param {string} webhookId - Webhook ID
   */
  async unsubscribe(webhookId) {
    try {
      await db.query(
        'UPDATE webhook_subscriptions SET active = FALSE WHERE id = $1',
        [webhookId]
      );

      logger.audit('Webhook subscription deactivated', {
        webhook_id: webhookId,
      });
    } catch (error) {
      logger.error('Failed to delete webhook subscription', error);
      throw error;
    }
  }

  /**
   * Process pending webhook deliveries
   * This should be called by a cron job or worker
   */
  async processDeliveries() {
    try {
      // Get pending deliveries that are due
      const deliveries = await db.query(
        `SELECT wd.*, ws.url, ws.secret 
         FROM webhook_deliveries wd
         JOIN webhook_subscriptions ws ON wd.webhook_id = ws.id
         WHERE wd.success = FALSE 
           AND wd.attempts < wd.max_attempts
           AND (wd.next_retry_at IS NULL OR wd.next_retry_at <= NOW())
         LIMIT 50`
      );

      logger.info(`Processing ${deliveries.rows.length} webhook deliveries`);

      for (const delivery of deliveries.rows) {
        await this.deliverWebhook(delivery);
      }
    } catch (error) {
      logger.error('Failed to process webhook deliveries', error);
    }
  }

  /**
   * Deliver webhook to endpoint
   * @param {object} delivery - Webhook delivery record
   */
  async deliverWebhook(delivery) {
    try {
      const { id, url, secret, event_type, payload } = delivery;

      // Create HMAC signature
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      // Send webhook
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': event_type,
        },
        timeout: 10000, // 10 seconds
      });

      // Mark as successful
      await db.query(
        `UPDATE webhook_deliveries 
         SET success = TRUE, 
             response_status = $1, 
             response_body = $2,
             attempts = attempts + 1
         WHERE id = $3`,
        [response.status, response.data, id]
      );

      logger.info(`Webhook delivered successfully: ${id}`);
    } catch (error) {
      logger.error(`Webhook delivery failed: ${delivery.id}`, error);

      // Update delivery with failure
      const attempts = delivery.attempts + 1;
      const nextRetry = this.calculateNextRetry(attempts);

      await db.query(
        `UPDATE webhook_deliveries 
         SET response_status = $1, 
             response_body = $2,
             attempts = $3,
             next_retry_at = $4
         WHERE id = $5`,
        [
          error.response?.status || 500,
          error.message,
          attempts,
          nextRetry,
          delivery.id,
        ]
      );
    }
  }

  /**
   * Calculate next retry time with exponential backoff
   * @param {number} attempts - Number of attempts
   * @returns {Date} Next retry time
   */
  calculateNextRetry(attempts) {
    const baseDelay = 60 * 1000; // 1 minute
    const maxDelay = 60 * 60 * 1000; // 1 hour
    const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);

    return new Date(Date.now() + delay);
  }

  /**
   * Clean up old webhook deliveries
   */
  async cleanupOldDeliveries() {
    try {
      const result = await db.query(
        `DELETE FROM webhook_deliveries 
         WHERE created_at < NOW() - INTERVAL '30 days'`
      );

      logger.info(`Cleaned up ${result.rowCount} old webhook deliveries`);
    } catch (error) {
      logger.error('Failed to cleanup old deliveries', error);
    }
  }
}

module.exports = new WebhookService();

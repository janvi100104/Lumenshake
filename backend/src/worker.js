/**
 * Background Worker
 * Handles webhook delivery and transaction reconciliation
 * Run this as a separate process: node src/worker.js
 */

const webhookService = require('./services/webhook');
const sep31Service = require('./services/sep31');
const logger = require('./services/logger');
const db = require('./database/db');

class Worker {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the worker
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🔧 Background worker started');

    // Process webhooks every 30 seconds
    this.webhookInterval = setInterval(async () => {
      try {
        await webhookService.processDeliveries();
      } catch (error) {
        logger.error('Webhook processing failed', error);
      }
    }, 30 * 1000); // 30 seconds

    // Reconcile transactions every 5 minutes
    this.reconciliationInterval = setInterval(async () => {
      try {
        await sep31Service.reconcileTransactions();
      } catch (error) {
        logger.error('Transaction reconciliation failed', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup old deliveries every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        await webhookService.cleanupOldDeliveries();
      } catch (error) {
        logger.error('Cleanup failed', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Stop the worker
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    clearInterval(this.webhookInterval);
    clearInterval(this.reconciliationInterval);
    clearInterval(this.cleanupInterval);

    logger.info('Background worker stopped');
  }
}

// Start worker if run directly
if (require.main === module) {
  const worker = new Worker();
  worker.start();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await worker.stop();
    await db.pool.end();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await worker.stop();
    await db.pool.end();
    process.exit(0);
  });
}

module.exports = Worker;

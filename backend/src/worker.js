/**
 * Background Worker
 * Handles webhook delivery and transaction reconciliation
 * Run this as a separate process: node src/worker.js
 */

const webhookService = require('./services/webhook');
const sep31Service = require('./services/sep31');
const moneygramService = require('./services/moneygram');
const recurringPayrollService = require('./services/recurringPayroll');
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

    // Reconcile SEP-31 transactions every 5 minutes
    this.reconciliationInterval = setInterval(async () => {
      try {
        await sep31Service.reconcileTransactions();
      } catch (error) {
        logger.error('Transaction reconciliation failed', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Poll MoneyGram transaction status every 2 minutes
    this.moneygramPollingInterval = setInterval(async () => {
      try {
        await this.pollMoneyGramTransactions();
      } catch (error) {
        logger.error('MoneyGram polling failed', error);
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Process recurring payroll schedules every 1 minute
    this.recurringPayrollInterval = setInterval(async () => {
      try {
        await this.processRecurringPayroll();
      } catch (error) {
        logger.error('Recurring payroll processing failed', error);
      }
    }, 60 * 1000); // 1 minute

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
    clearInterval(this.moneygramPollingInterval);
    clearInterval(this.recurringPayrollInterval);
    clearInterval(this.cleanupInterval);

    logger.info('Background worker stopped');
  }

  /**
   * Poll MoneyGram transactions for status updates
   * Checks transactions that are processing or submitted
   */
  async pollMoneyGramTransactions() {
    try {
      // Get transactions that need status checking
      const result = await db.query(
        `SELECT * FROM moneygram_transactions 
         WHERE status IN ('submitted', 'processing', 'processing_payment') 
         AND updated_at < NOW() - INTERVAL '1 minute'
         ORDER BY created_at ASC
         LIMIT 20`
      );

      if (result.rows.length === 0) {
        return;
      }

      logger.info(`Polling ${result.rows.length} MoneyGram transactions for status updates`);

      for (const transaction of result.rows) {
        try {
          const currentStatus = transaction.status;
          const updatedTransaction = await moneygramService.getCashOutStatus(transaction.moneygram_reference);

          if (updatedTransaction && updatedTransaction.status !== currentStatus) {
            logger.info(`MoneyGram transaction ${transaction.moneygram_reference} status changed: ${currentStatus} → ${updatedTransaction.status}`);

            // Send webhook notification for status change
            if (['ready_for_pickup', 'completed', 'failed', 'refunded'].includes(updatedTransaction.status)) {
              await webhookService.triggerWebhook(
                `moneygram.transaction.${updatedTransaction.status.replace(/_/g, '.')}`,
                {
                  reference: transaction.moneygram_reference,
                  status: updatedTransaction.status,
                  amount: transaction.fiat_amount,
                  currency: transaction.fiat_currency,
                  receiver: transaction.receiver_name,
                  tracking_number: updatedTransaction.tracking_number,
                  updated_at: new Date().toISOString(),
                }
              );
            }
          }
        } catch (error) {
          logger.error(`Failed to poll MoneyGram transaction ${transaction.moneygram_reference}`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to poll MoneyGram transactions', error);
    }
  }

  /**
   * Process recurring payroll schedules
   * Automatically runs payroll for schedules that are due
   */
  async processRecurringPayroll() {
    try {
      const results = await recurringPayrollService.processScheduledRuns();
      
      if (results.length > 0) {
        const completed = results.filter(r => r.status === 'completed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        
        logger.info(`Recurring payroll processed: ${completed} completed, ${failed} failed`, {
          total: results.length,
          completed,
          failed
        });
      }
    } catch (error) {
      logger.error('Failed to process recurring payroll', error);
    }
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

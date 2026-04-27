/**
 * Metrics Service
 * Collects and aggregates metrics for dashboard display
 * Tracks DAU, transactions, retention, and system health
 */

const db = require('../database/db');
const logger = require('./logger');

class MetricsService {
  /**
   * Get overall system metrics
   */
  async getSystemMetrics() {
    try {
      const metrics = await Promise.all([
        this.getUserMetrics(),
        this.getTransactionMetrics(),
        this.getFinancialMetrics(),
        this.getSystemHealthMetrics(),
      ]);

      return {
        users: metrics[0],
        transactions: metrics[1],
        financial: metrics[2],
        system: metrics[3],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get system metrics', error);
      throw error;
    }
  }

  /**
   * Get user metrics (DAU, MAU, retention)
   */
  async getUserMetrics() {
    try {
      // Total users
      const totalUsers = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM employers) as employers,
          (SELECT COUNT(*) FROM employees) as employees,
          (SELECT COUNT(*) FROM sep12_customers WHERE kyc_status = 'APPROVED') as kyc_approved
      `);

      // Daily Active Users (last 7 days)
      const dau = await db.query(`
        SELECT DATE(created_at) as date, COUNT(DISTINCT stellar_address) as users
        FROM sep10_nonces
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      // Monthly Active Users (last 30 days)
      const mau = await db.query(`
        SELECT COUNT(DISTINCT stellar_address) as users
        FROM sep10_nonces
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      // User growth (last 30 days)
      const userGrowth = await db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_users
        FROM (
          SELECT created_at FROM employers WHERE created_at >= NOW() - INTERVAL '30 days'
          UNION ALL
          SELECT created_at FROM employees WHERE created_at >= NOW() - INTERVAL '30 days'
        ) all_users
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      return {
        total: {
          employers: parseInt(totalUsers.rows[0].employers),
          employees: parseInt(totalUsers.rows[0].employees),
          total: parseInt(totalUsers.rows[0].employers) + parseInt(totalUsers.rows[0].employees),
          kyc_approved: parseInt(totalUsers.rows[0].kyc_approved),
        },
        active: {
          daily: dau.rows.map(row => ({
            date: row.date,
            users: parseInt(row.users),
          })),
          monthly: parseInt(mau.rows[0].users),
        },
        growth: {
          last_30_days: userGrowth.rows.map(row => ({
            date: row.date,
            new_users: parseInt(row.new_users),
          })),
        },
      };
    } catch (error) {
      logger.error('Failed to get user metrics', error);
      return { total: {}, active: {}, growth: {} };
    }
  }

  /**
   * Get transaction metrics
   */
  async getTransactionMetrics() {
    try {
      // Transaction counts by type
      const transactionCounts = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM payroll_periods) as payroll_periods,
          (SELECT COUNT(*) FROM payroll_claims) as payroll_claims,
          (SELECT COUNT(*) FROM sep24_transactions) as sep24_transactions,
          (SELECT COUNT(*) FROM sep31_transactions) as sep31_transactions,
          (SELECT COUNT(*) FROM moneygram_transactions) as moneygram_transactions
      `);

      // Transaction status breakdown
      const moneygramStatus = await db.query(`
        SELECT status, COUNT(*) as count
        FROM moneygram_transactions
        GROUP BY status
      `);

      // Transactions over time (last 30 days)
      const transactionTrend = await db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM (
          SELECT created_at FROM payroll_claims WHERE created_at >= NOW() - INTERVAL '30 days'
          UNION ALL
          SELECT created_at FROM moneygram_transactions WHERE created_at >= NOW() - INTERVAL '30 days'
        ) all_tx
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      // Success rate
      const successRate = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'completed') as successful,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) as total
        FROM moneygram_transactions
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      return {
        counts: {
          payroll_periods: parseInt(transactionCounts.rows[0].payroll_periods),
          payroll_claims: parseInt(transactionCounts.rows[0].payroll_claims),
          sep24: parseInt(transactionCounts.rows[0].sep24_transactions),
          sep31: parseInt(transactionCounts.rows[0].sep31_transactions),
          moneygram: parseInt(transactionCounts.rows[0].moneygram_transactions),
          total: Object.values(transactionCounts.rows[0]).reduce((a, b) => parseInt(a) + parseInt(b), 0),
        },
        moneygram_status: moneygramStatus.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count),
        })),
        trend: transactionTrend.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count),
        })),
        success_rate: successRate.rows[0].total > 0 
          ? (parseInt(successRate.rows[0].successful) / parseInt(successRate.rows[0].total) * 100).toFixed(2)
          : 0,
      };
    } catch (error) {
      logger.error('Failed to get transaction metrics', error);
      return { counts: {}, moneygram_status: [], trend: [], success_rate: 0 };
    }
  }

  /**
   * Get financial metrics
   */
  async getFinancialMetrics() {
    try {
      // Total payroll distributed
      const payrollVolume = await db.query(`
        SELECT 
          COALESCE(SUM(salary), 0) as total_payroll,
          COUNT(*) as total_payments
        FROM payroll_claims
        WHERE status = 'completed'
      `);

      // MoneyGram cash-out volume
      const moneygramVolume = await db.query(`
        SELECT 
          COALESCE(SUM(CAST(crypto_amount AS DECIMAL)), 0) as total_crypto,
          COALESCE(SUM(CAST(fiat_amount AS DECIMAL)), 0) as total_fiat,
          COUNT(*) as total_cashouts
        FROM moneygram_transactions
        WHERE status IN ('completed', 'ready_for_pickup')
      `);

      // Average transaction values
      const averages = await db.query(`
        SELECT 
          AVG(salary) as avg_payroll,
          AVG(CAST(crypto_amount AS DECIMAL)) FILTER (WHERE crypto_amount IS NOT NULL) as avg_cashout
        FROM payroll_claims pc
        LEFT JOIN moneygram_transactions mt ON pc.id = mt.id
      `);

      return {
        payroll: {
          total_volume: parseFloat(payrollVolume.rows[0].total_payroll),
          total_payments: parseInt(payrollVolume.rows[0].total_payments),
          average_payment: parseFloat(averages.rows[0].avg_payroll || 0),
        },
        cashout: {
          total_crypto: parseFloat(moneygramVolume.rows[0].total_crypto),
          total_fiat: parseFloat(moneygramVolume.rows[0].total_fiat),
          total_cashouts: parseInt(moneygramVolume.rows[0].total_cashouts),
          average_cashout: parseFloat(averages.rows[0].avg_cashout || 0),
        },
      };
    } catch (error) {
      logger.error('Failed to get financial metrics', error);
      return { payroll: {}, cashout: {} };
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealthMetrics() {
    try {
      // Database connection
      const dbHealth = await db.query('SELECT 1');
      
      // Webhook delivery status
      const webhookStatus = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE success = TRUE) as successful,
          COUNT(*) FILTER (WHERE success = FALSE) as failed,
          COUNT(*) as total
        FROM webhook_deliveries
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `);

      // Pending tasks
      const pendingTasks = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM webhook_deliveries WHERE success = FALSE AND attempts < max_attempts) as pending_webhooks,
          (SELECT COUNT(*) FROM moneygram_transactions WHERE status IN ('submitted', 'processing')) as pending_moneygram
      `);

      // Audit log count (last 24 hours)
      const auditCount = await db.query(`
        SELECT COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `);

      return {
        database: dbHealth.rows.length > 0 ? 'healthy' : 'unhealthy',
        webhooks: {
          successful_24h: parseInt(webhookStatus.rows[0].successful),
          failed_24h: parseInt(webhookStatus.rows[0].failed),
          success_rate: webhookStatus.rows[0].total > 0
            ? (parseInt(webhookStatus.rows[0].successful) / parseInt(webhookStatus.rows[0].total) * 100).toFixed(2)
            : 100,
        },
        pending: {
          webhooks: parseInt(pendingTasks.rows[0].pending_webhooks),
          moneygram: parseInt(pendingTasks.rows[0].pending_moneygram),
        },
        audit_events_24h: parseInt(auditCount.rows[0].count),
        uptime: process.uptime(),
      };
    } catch (error) {
      logger.error('Failed to get system health metrics', error);
      return {
        database: 'unhealthy',
        webhooks: {},
        pending: {},
        audit_events_24h: 0,
        uptime: 0,
      };
    }
  }

  /**
   * Get metrics for specific time range
   */
  async getMetricsByTimeRange(days = 30) {
    try {
      const metrics = await this.getSystemMetrics();
      
      // Add historical data
      metrics.history = await this.getHistoricalMetrics(days);
      
      return metrics;
    } catch (error) {
      logger.error('Failed to get metrics by time range', error);
      throw error;
    }
  }

  /**
   * Get historical metrics for charts
   */
  async getHistoricalMetrics(days = 30) {
    try {
      // Daily user signups
      const userSignups = await db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as users
        FROM (
          SELECT created_at FROM employers WHERE created_at >= NOW() - INTERVAL '${days} days'
          UNION ALL
          SELECT created_at FROM employees WHERE created_at >= NOW() - INTERVAL '${days} days'
        ) all_users
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      // Daily transaction volume
      const transactionVolume = await db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as transactions,
          COALESCE(SUM(CAST(crypto_amount AS DECIMAL)), 0) as volume
        FROM moneygram_transactions
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      return {
        user_signups: userSignups.rows.map(row => ({
          date: row.date,
          users: parseInt(row.users),
        })),
        transaction_volume: transactionVolume.rows.map(row => ({
          date: row.date,
          transactions: parseInt(row.transactions),
          volume: parseFloat(row.volume),
        })),
      };
    } catch (error) {
      logger.error('Failed to get historical metrics', error);
      return { user_signups: [], transaction_volume: [] };
    }
  }
}

module.exports = new MetricsService();

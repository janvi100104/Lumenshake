/**
 * Prometheus Metrics Middleware
 * Exposes application metrics in Prometheus format
 * Tracks HTTP requests, response times, errors, and business metrics
 */

const promClient = require('prom-client');

// Create a Registry to register metrics
const register = new promClient.Registry();

// Enable default metrics (process metrics, Node.js metrics)
promClient.collectDefaultMetrics({ register });

// Custom metrics

// HTTP request duration histogram
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register],
});

// HTTP request counter
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Active requests gauge
const activeRequestsGauge = new promClient.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests',
  registers: [register],
});

// Business metrics
const payrollTransactionsCounter = new promClient.Counter({
  name: 'payroll_transactions_total',
  help: 'Total number of payroll transactions',
  labelNames: ['status'],
  registers: [register],
});

const moneygramTransactionsCounter = new promClient.Counter({
  name: 'moneygram_transactions_total',
  help: 'Total number of MoneyGram transactions',
  labelNames: ['status', 'currency'],
  registers: [register],
});

const webhookDeliveriesCounter = new promClient.Counter({
  name: 'webhook_deliveries_total',
  help: 'Total number of webhook deliveries',
  labelNames: ['success', 'event_type'],
  registers: [register],
});

const sep10AuthCounter = new promClient.Counter({
  name: 'sep10_auth_attempts_total',
  help: 'Total number of SEP-10 authentication attempts',
  labelNames: ['success'],
  registers: [register],
});

// Database connection pool metrics
const dbConnectionPoolGauge = new promClient.Gauge({
  name: 'db_connection_pool_size',
  help: 'Database connection pool size',
  labelNames: ['status'], // active, idle, total
  registers: [register],
});

// Error counter
const errorCounter = new promClient.Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['error_type', 'route'],
  registers: [register],
});

/**
 * Metrics middleware - tracks HTTP requests
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  // Track active requests
  activeRequestsGauge.inc();

  // Listen for response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode.toString();

    // Record duration
    httpRequestDurationMicroseconds
      .labels(req.method, route, statusCode)
      .observe(duration);

    // Increment request counter
    httpRequestCounter
      .labels(req.method, route, statusCode)
      .inc();

    // Decrement active requests
    activeRequestsGauge.dec();

    // Track errors
    if (res.statusCode >= 400) {
      errorCounter
        .labels('http_error', route)
        .inc();
    }
  });

  next();
}

/**
 * Get metrics endpoint handler
 * Returns metrics in Prometheus format
 */
async function metricsEndpoint(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

/**
 * Track business metrics
 */
const businessMetrics = {
  trackPayrollTransaction: (status) => {
    payrollTransactionsCounter.labels(status).inc();
  },

  trackMoneygramTransaction: (status, currency) => {
    moneygramTransactionsCounter.labels(status, currency).inc();
  },

  trackWebhookDelivery: (success, eventType) => {
    webhookDeliveriesCounter.labels(success.toString(), eventType).inc();
  },

  trackSEP10Auth: (success) => {
    sep10AuthCounter.labels(success.toString()).inc();
  },

  trackDatabaseConnections: (active, idle, total) => {
    dbConnectionPoolGauge.labels('active').set(active);
    dbConnectionPoolGauge.labels('idle').set(idle);
    dbConnectionPoolGauge.labels('total').set(total);
  },

  trackError: (errorType, route) => {
    errorCounter.labels(errorType, route).inc();
  },
};

/**
 * Get current metrics values (for debugging)
 */
async function getMetrics() {
  return await register.getMetricsAsJSON();
}

/**
 * Reset all metrics (for testing)
 */
function resetMetrics() {
  register.resetMetrics();
}

module.exports = {
  register,
  metricsMiddleware,
  metricsEndpoint,
  businessMetrics,
  httpRequestDurationMicroseconds,
  httpRequestCounter,
  activeRequestsGauge,
  errorCounter,
  getMetrics,
  resetMetrics,
};

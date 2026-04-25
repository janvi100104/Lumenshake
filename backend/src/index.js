const express = require('express');
const cors = require('cors');
require('dotenv').config();

const logger = require('./services/logger');
const db = require('./database/db');
const payrollRoutes = require('./routes/payroll');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const sep24Routes = require('./routes/sep24');
const sep31Routes = require('./routes/sep31');
const webhookRoutes = require('./routes/webhooks');
const moneygramRoutes = require('./routes/moneygram');
const idempotencyMiddleware = require('./middleware/idempotency');
const auditMiddleware = require('./middleware/audit');
const { strictLimiter, standardLimiter } = require('./middleware/rateLimiter');
const { securityHeaders, customSecurityHeaders } = require('./middleware/security');
const { sanitizeInput } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(customSecurityHeaders);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware (with payload size limit)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input sanitization
app.use(sanitizeInput);

// Custom middleware
app.use(idempotencyMiddleware);
app.use(auditMiddleware);

// Global rate limiter
app.use(standardLimiter.middleware());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', strictLimiter.middleware(), authRoutes); // SEP-10 authentication (strict rate limit)
app.use('/api/customer', customerRoutes); // SEP-12 customer/KYC
app.use('/api/sep24', sep24Routes); // SEP-24 interactive payments
app.use('/api/sep31', sep31Routes); // SEP-31 send/receive
app.use('/api/webhooks', webhookRoutes); // Webhook management
app.use('/api/moneygram', moneygramRoutes); // MoneyGram cash-out
app.use('/api/payroll', payrollRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    logger.info('✓ Database connection verified');
    
    app.listen(PORT, () => {
      logger.info(`🚀 LumenShake Backend running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 API: http://localhost:${PORT}/api`);
      logger.info(`🏥 Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await db.pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await db.pool.end();
  process.exit(0);
});

startServer();

module.exports = app;

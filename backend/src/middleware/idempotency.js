const db = require('../database/db');
const logger = require('../services/logger');

// Idempotency middleware to prevent duplicate requests
const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  if (!idempotencyKey) {
    return next();
  }

  try {
    // Check if this request has already been processed
    const existing = await db.query(
      'SELECT * FROM idempotency_keys WHERE key = $1 AND expires_at > NOW()',
      [idempotencyKey]
    );

    if (existing.rows.length > 0) {
      logger.info('Idempotent request - returning cached response', {
        key: idempotencyKey,
      });
      
      const cached = existing.rows[0];
      res.status(cached.response_status).json(cached.response_body);
      return;
    }

    // Store response for future duplicate requests
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      db.query(
        `INSERT INTO idempotency_keys (key, request_method, request_path, response_status, response_body)
         VALUES ($1, $2, $3, $4, $5)`,
        [idempotencyKey, req.method, req.path, res.statusCode, body]
      ).catch(err => logger.error('Failed to cache idempotent response', err));
      
      return originalJson(body);
    };

    next();
  } catch (error) {
    logger.error('Idempotency middleware error', error);
    next();
  }
};

module.exports = idempotencyMiddleware;

const logger = require('../services/logger');
const db = require('../database/db');

// Audit logging middleware
const auditMiddleware = async (req, res, next) => {
  const startTime = Date.now();
  
  // Capture original end function
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Log to audit trail for important endpoints
    if (req.path.includes('/api/')) {
      db.query(
        `INSERT INTO audit_logs (level, action, actor_address, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          res.statusCode >= 400 ? 'error' : 'info',
          `${req.method} ${req.path}`,
          req.headers['x-stellar-address'] || null,
          req.ip,
          req.headers['user-agent'],
          JSON.stringify({
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            query: req.query,
          }),
        ]
      ).catch(err => logger.error('Failed to write audit log', err));
    }
    
    // Call original end
    originalEnd.apply(res, args);
  };
  
  next();
};

module.exports = auditMiddleware;

const helmet = require('helmet');

/**
 * Security Headers Middleware
 * Uses helmet to set various HTTP headers for security
 */
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://soroban-testnet.stellar.org'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Cross-Origin policies
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
});

/**
 * Additional custom security headers
 */
const customSecurityHeaders = (req, res, next) => {
  // Remove Server header
  res.removeHeader('Server');

  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Prevent caching of sensitive data
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');

  // Custom headers
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '0'); // Modern browsers use CSP instead
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};

module.exports = {
  securityHeaders,
  customSecurityHeaders,
};

/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 */

const rateLimitStore = new Map();

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.maxRequests = options.maxRequests || 100; // requests per window
    this.message = options.message || 'Too many requests, please try again later';
  }

  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      const now = Date.now();
      const windowStart = now - this.windowMs;

      // Clean old entries
      if (rateLimitStore.has(key)) {
        const requests = rateLimitStore.get(key).filter(time => time > windowStart);
        rateLimitStore.set(key, requests);
      }

      // Get current request count
      const currentRequests = rateLimitStore.get(key) || [];

      if (currentRequests.length >= this.maxRequests) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: this.message,
          retryAfter: Math.ceil(this.windowMs / 1000),
        });
      }

      // Add current request
      currentRequests.push(now);
      rateLimitStore.set(key, currentRequests);

      // Set headers
      res.set('X-RateLimit-Limit', this.maxRequests.toString());
      res.set('X-RateLimit-Remaining', (this.maxRequests - currentRequests.length).toString());
      res.set('X-RateLimit-Reset', Math.ceil((now + this.windowMs) / 1000).toString());

      next();
    };
  }

  getKey(req) {
    // Use IP address or API key if available
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  // Clear rate limit for specific key (for admin use)
  clear(key) {
    rateLimitStore.delete(key);
  }

  // Reset all rate limits
  resetAll() {
    rateLimitStore.clear();
  }
}

// Pre-configured rate limiters
const strictLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later',
});

const standardLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});

const generousLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1000,
});

module.exports = {
  RateLimiter,
  strictLimiter,
  standardLimiter,
  generousLimiter,
};

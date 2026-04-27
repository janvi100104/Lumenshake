/**
 * Rate Limiting Middleware - Optimized for 30+ concurrent users
 * Uses sliding window algorithm with efficient memory management
 */

const crypto = require('crypto');

// In-memory store with LRU eviction
const rateLimitStore = new Map();
const MAX_STORE_SIZE = 10000; // Prevent memory leaks

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.maxRequests = options.maxRequests || 100; // requests per window
    this.message = options.message || 'Too many requests, please try again later';
    this.headers = options.headers !== false; // Enable headers by default
  }

  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      const now = Date.now();
      const windowStart = now - this.windowMs;

      // Get or create request log for this key
      let requestLog = rateLimitStore.get(key);
      
      if (!requestLog) {
        requestLog = { timestamps: [], count: 0 };
        rateLimitStore.set(key, requestLog);
        
        // LRU eviction - remove oldest entries if store is too large
        if (rateLimitStore.size > MAX_STORE_SIZE) {
          const firstKey = rateLimitStore.keys().next().value;
          rateLimitStore.delete(firstKey);
        }
      }

      // Remove timestamps outside the current window
      requestLog.timestamps = requestLog.timestamps.filter(time => time > windowStart);
      requestLog.count = requestLog.timestamps.length;

      // Check if rate limit exceeded
      if (requestLog.count >= this.maxRequests) {
        const retryAfter = Math.ceil(this.windowMs / 1000);
        res.set('Retry-After', retryAfter.toString());
        
        if (this.headers) {
          res.set('X-RateLimit-Limit', this.maxRequests.toString());
          res.set('X-RateLimit-Remaining', '0');
          res.set('X-RateLimit-Reset', Math.ceil((now + this.windowMs) / 1000).toString());
        }

        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: this.message,
          retryAfter,
        });
      }

      // Add current request timestamp
      requestLog.timestamps.push(now);
      requestLog.count++;

      // Set rate limit headers
      if (this.headers) {
        res.set('X-RateLimit-Limit', this.maxRequests.toString());
        res.set('X-RateLimit-Remaining', Math.max(0, this.maxRequests - requestLog.count).toString());
        res.set('X-RateLimit-Reset', Math.ceil((now + this.windowMs) / 1000).toString());
      }

      next();
    };
  }

  getKey(req) {
    // Use IP address, forwarded IP, or API key if available
    const ip = req.ip || 
               req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               'unknown';
    
    // Create a hash to reduce memory usage for long IPs
    return crypto.createHash('md5').update(ip).digest('hex').substring(0, 16);
  }

  // Clear rate limit for specific key (for admin use)
  clear(key) {
    rateLimitStore.delete(key);
  }

  // Reset all rate limits
  resetAll() {
    rateLimitStore.clear();
  }

  // Get current rate limit stats for monitoring
  getStats() {
    return {
      totalKeys: rateLimitStore.size,
      maxStoreSize: MAX_STORE_SIZE,
    };
  }
}

// Pre-configured rate limiters - Optimized for 30+ concurrent users
const strictLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // Increased from 50 to handle 30+ users
  message: 'Too many authentication attempts, please try again later',
});

const standardLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 200, // Increased from 100 to handle 30+ users (6-7 req/user/min)
});

const generousLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 2000, // Increased from 1000 for higher throughput
});

// Health check endpoint should have very liberal limits
const healthLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 500, // Allow frequent health checks
  headers: false, // Don't add headers for health checks
});

module.exports = {
  RateLimiter,
  strictLimiter,
  standardLimiter,
  generousLimiter,
  healthLimiter,
};

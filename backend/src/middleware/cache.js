/**
 * Response Caching Middleware
 * Caches GET request responses to reduce database load and improve response times
 * Optimized for 30+ concurrent users
 */

const NodeCache = require('node-cache');

// Initialize cache with optimal settings
const cache = new NodeCache({
  stdTTL: 60, // Default TTL: 60 seconds
  checkperiod: 120, // Check for expired keys every 2 minutes
  maxKeys: 1000, // Maximum number of cached items
  useClones: false, // Better performance for large objects
});

// Cache statistics
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Create caching middleware
 * @param {Object} options - Cache configuration
 * @param {number} options.ttl - Time to live in seconds
 * @param {string[]} options.excludeQueryParams - Query params to exclude from cache key
 * @param {Function} options.keyGenerator - Custom key generator function
 */
function createCacheMiddleware(options = {}) {
  const {
    ttl = 60,
    excludeQueryParams = [],
    keyGenerator = null,
  } = options;

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    let cacheKey;
    if (keyGenerator) {
      cacheKey = keyGenerator(req);
    } else {
      // Default key: method + path + sorted query params
      const filteredQuery = { ...req.query };
      excludeQueryParams.forEach(param => delete filteredQuery[param]);
      
      const sortedQuery = Object.keys(filteredQuery)
        .sort()
        .map(key => `${key}=${filteredQuery[key]}`)
        .join('&');
      
      cacheKey = `${req.method}:${req.path}?${sortedQuery}`;
    }

    // Try to get cached response
    const cachedResponse = cache.get(cacheKey);
    
    if (cachedResponse) {
      cacheHits++;
      
      // Set cache headers
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Key', cacheKey.substring(0, 50) + '...');
      
      // Return cached response
      return res.status(cachedResponse.status).json(cachedResponse.data);
    }

    cacheMisses++;

    // Store original res.json method
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          status: res.statusCode,
          data: body,
        }, ttl);
      }

      // Set cache headers
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-TTL', ttl.toString());

      // Call original json method
      return originalJson(body);
    };

    next();
  };
}

/**
 * Clear cache by pattern or all
 */
const clearCache = (pattern = null) => {
  if (pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    cache.del(matchingKeys);
    return matchingKeys.length;
  }
  
  cache.flushAll();
  return 'all';
};

/**
 * Get cache statistics
 */
const getCacheStats = () => ({
  hits: cacheHits,
  misses: cacheMisses,
  hitRate: cacheHits + cacheMisses > 0 
    ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(2) + '%'
    : '0%',
  keys: cache.keys().length,
  maxKeys: 1000,
  hitRate: cacheHits + cacheMisses > 0 
    ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(2) + '%'
    : '0%',
});

/**
 * Pre-configured cache middlewares for common use cases
 */
const cacheMiddlewares = {
  // Short cache for frequently changing data (30 seconds)
  short: createCacheMiddleware({ ttl: 30 }),
  
  // Medium cache for relatively stable data (5 minutes)
  medium: createCacheMiddleware({ ttl: 300 }),
  
  // Long cache for static data (1 hour)
  long: createCacheMiddleware({ ttl: 3600 }),
  
  // Custom cache for specific endpoints
  exchangeRate: createCacheMiddleware({ 
    ttl: 60, // Cache exchange rates for 1 minute
    excludeQueryParams: ['timestamp'], // Ignore timestamp param
  }),
  
  locations: createCacheMiddleware({ 
    ttl: 300, // Cache locations for 5 minutes
  }),
};

module.exports = {
  cache,
  createCacheMiddleware,
  clearCache,
  getCacheStats,
  cacheMiddlewares,
  cacheHits: () => cacheHits,
  cacheMisses: () => cacheMisses,
};

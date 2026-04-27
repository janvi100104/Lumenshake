const { Pool } = require('pg');
require('dotenv').config();

// Optimized connection pool for 30+ concurrent users
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lumenshake',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  
  // Connection pool sizing for 30+ concurrent users
  max: 50, // Increased from 20 to handle more concurrent queries
  min: 5,  // Minimum idle connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased from 2000 for better reliability
  maxUses: 7500, // Recycle connections after 7500 uses to prevent leaks
  
  // Query timeout
  statement_timeout: 30000, // 30 seconds max per query
  
  // SSL for production (optional)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Pool event monitoring
let connectionCount = 0;
let activeQueries = 0;

pool.on('connect', () => {
  connectionCount++;
  console.log(`✓ Database connected (total: ${connectionCount})`);
});

pool.on('acquire', () => {
  activeQueries++;
});

pool.on('release', () => {
  activeQueries = Math.max(0, activeQueries - 1);
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit - let the pool handle reconnection
});

// Pool statistics for monitoring
const getPoolStats = () => ({
  totalConnections: connectionCount,
  activeQueries,
  idleConnections: connectionCount - activeQueries,
  maxConnections: pool.totalCount,
  waitingClients: pool.waitingCount || 0,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  getPoolStats,
};

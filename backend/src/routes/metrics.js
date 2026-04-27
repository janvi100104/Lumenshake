const express = require('express');
const router = express.Router();
const metricsService = require('../services/metrics');
const sep10Service = require('../services/sep10');
const logger = require('../services/logger');

/**
 * GET /api/metrics/system
 * Get overall system metrics
 */
router.get('/system', sep10Service.authenticate, async (req, res) => {
  try {
    const metrics = await metricsService.getSystemMetrics();
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get system metrics', error);
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message,
    });
  }
});

/**
 * GET /api/metrics/users
 * Get user metrics (DAU, MAU, retention)
 */
router.get('/users', sep10Service.authenticate, async (req, res) => {
  try {
    const metrics = await metricsService.getUserMetrics();
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get user metrics', error);
    res.status(500).json({
      error: 'Failed to retrieve user metrics',
      message: error.message,
    });
  }
});

/**
 * GET /api/metrics/transactions
 * Get transaction metrics
 */
router.get('/transactions', sep10Service.authenticate, async (req, res) => {
  try {
    const metrics = await metricsService.getTransactionMetrics();
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get transaction metrics', error);
    res.status(500).json({
      error: 'Failed to retrieve transaction metrics',
      message: error.message,
    });
  }
});

/**
 * GET /api/metrics/financial
 * Get financial metrics
 */
router.get('/financial', sep10Service.authenticate, async (req, res) => {
  try {
    const metrics = await metricsService.getFinancialMetrics();
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get financial metrics', error);
    res.status(500).json({
      error: 'Failed to retrieve financial metrics',
      message: error.message,
    });
  }
});

/**
 * GET /api/metrics/health
 * Get system health metrics
 */
router.get('/health', sep10Service.authenticate, async (req, res) => {
  try {
    const metrics = await metricsService.getSystemHealthMetrics();
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get health metrics', error);
    res.status(500).json({
      error: 'Failed to retrieve health metrics',
      message: error.message,
    });
  }
});

/**
 * GET /api/metrics/history
 * Get historical metrics for charts
 */
router.get('/history', sep10Service.authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const metrics = await metricsService.getHistoricalMetrics(days);
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get historical metrics', error);
    res.status(500).json({
      error: 'Failed to retrieve historical metrics',
      message: error.message,
    });
  }
});

/**
 * GET /api/metrics/dashboard
 * Get complete dashboard data (all metrics)
 */
router.get('/dashboard', sep10Service.authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const metrics = await metricsService.getMetricsByTimeRange(days);
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get dashboard metrics', error);
    res.status(500).json({
      error: 'Failed to retrieve dashboard metrics',
      message: error.message,
    });
  }
});

module.exports = router;

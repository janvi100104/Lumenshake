const express = require('express');
const router = express.Router();
const webhookService = require('../services/webhook');
const logger = require('../services/logger');

/**
 * POST /webhooks/subscribe
 * Register webhook subscription
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { url, event_types, secret } = req.body;

    if (!url || !event_types || !Array.isArray(event_types)) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'url and event_types (array) are required',
      });
    }

    const webhook = await webhookService.subscribe({
      url,
      event_types,
      secret,
    });

    res.status(201).json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    logger.error('Failed to create webhook subscription', error);
    res.status(500).json({
      error: 'Failed to create webhook subscription',
      message: error.message,
    });
  }
});

/**
 * GET /webhooks
 * Get all webhook subscriptions
 */
router.get('/', async (req, res) => {
  try {
    const webhooks = await webhookService.getSubscriptions();

    res.json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    logger.error('Failed to get webhook subscriptions', error);
    res.status(500).json({
      error: 'Failed to retrieve webhook subscriptions',
      message: error.message,
    });
  }
});

/**
 * DELETE /webhooks/:id
 * Unsubscribe from webhooks
 */
router.delete('/:id', async (req, res) => {
  try {
    await webhookService.unsubscribe(req.params.id);

    res.json({
      success: true,
      message: 'Webhook subscription deactivated',
    });
  } catch (error) {
    logger.error('Failed to unsubscribe webhook', error);
    res.status(500).json({
      error: 'Failed to unsubscribe webhook',
      message: error.message,
    });
  }
});

/**
 * POST /webhooks/process
 * Manually trigger webhook processing (for testing)
 */
router.post('/process', async (req, res) => {
  try {
    await webhookService.processDeliveries();

    res.json({
      success: true,
      message: 'Webhook processing triggered',
    });
  } catch (error) {
    logger.error('Failed to process webhooks', error);
    res.status(500).json({
      error: 'Failed to process webhooks',
      message: error.message,
    });
  }
});

module.exports = router;

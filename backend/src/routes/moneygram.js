const express = require('express');
const router = express.Router();
const moneygramService = require('../services/moneygram');
const sep10Service = require('../services/sep10');
const { addExplorerLinks, addExplorerLinksToArray } = require('../utils/explorer');
const logger = require('../services/logger');

/**
 * POST /cashout/initiate
 * Initiate a new cash-out transaction
 */
router.post('/initiate', sep10Service.authenticate, async (req, res) => {
  try {
    const {
      receiver_name,
      receiver_country,
      receiver_id_type,
      receiver_id_number,
      crypto_amount,
      crypto_currency = 'USDC',
      fiat_currency,
      payout_method = 'cash_pickup',
      payout_location_id,
    } = req.body;

    const result = await moneygramService.initiateCashOut({
      sender_stellar_account: req.stellarAccount,
      sender_name: 'Authenticated User', // Would come from KYC
      sender_country: 'US', // Would come from KYC
      sender_phone: req.body.sender_phone,
      receiver_name,
      receiver_country,
      receiver_id_type,
      receiver_id_number,
      crypto_amount,
      crypto_currency,
      fiat_currency,
      payout_method,
      payout_location_id,
    });

    res.status(201).json({
      success: true,
      data: result,
      next_steps: [
        'Send USDC to the provided escrow address',
        'Transaction will be processed automatically',
        'You will receive tracking details once ready for pickup',
      ],
    });
  } catch (error) {
    logger.error('Failed to initiate cash-out', error);
    res.status(500).json({
      error: 'Failed to initiate cash-out',
      message: error.message,
    });
  }
});

/**
 * GET /cashout/status/:reference
 * Get cash-out transaction status
 */
router.get('/status/:reference', sep10Service.authenticate, async (req, res) => {
  try {
    const transaction = await moneygramService.getCashOutStatus(req.params.reference);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: addExplorerLinks(transaction),
    });
  } catch (error) {
    logger.error('Failed to get cash-out status', error);
    res.status(500).json({
      error: 'Failed to retrieve transaction',
      message: error.message,
    });
  }
});

/**
 * GET /cashout/transactions
 * Get all cash-out transactions for authenticated user
 */
router.get('/transactions', sep10Service.authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const transactions = await moneygramService.getUserTransactions(req.stellarAccount, limit);

    res.json({
      success: true,
      data: addExplorerLinksToArray(transactions),
    });
  } catch (error) {
    logger.error('Failed to get transactions', error);
    res.status(500).json({
      error: 'Failed to retrieve transactions',
      message: error.message,
    });
  }
});

/**
 * GET /cashout/exchange-rate
 * Get current exchange rate
 */
router.get('/exchange-rate', async (req, res) => {
  try {
    const { base = 'USDC', target } = req.query;

    if (!target) {
      return res.status(400).json({
        error: 'Missing target currency',
        message: 'Please provide target currency (e.g., MXN, INR, PHP)',
      });
    }

    const rate = await moneygramService.getExchangeRate(base, target);

    if (!rate) {
      return res.status(404).json({
        error: 'Exchange rate not available',
        message: `Rate for ${base}/${target} is not currently available`,
      });
    }

    res.json({
      success: true,
      data: {
        base_currency: rate.base_currency,
        target_currency: rate.target_currency,
        rate: rate.rate,
        fee_percentage: rate.fee_percentage,
        valid_until: rate.valid_until,
      },
    });
  } catch (error) {
    logger.error('Failed to get exchange rate', error);
    res.status(500).json({
      error: 'Failed to retrieve exchange rate',
      message: error.message,
    });
  }
});

/**
 * GET /cashout/locations
 * Find nearby MoneyGram locations
 */
router.get('/locations', async (req, res) => {
  try {
    const { country, city, latitude, longitude, radius_km } = req.query;

    const locations = await moneygramService.findLocations({
      country,
      city,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      radius_km: radius_km ? parseFloat(radius_km) : 10,
    });

    res.json({
      success: true,
      data: locations,
      count: locations.length,
    });
  } catch (error) {
    logger.error('Failed to find locations', error);
    res.status(500).json({
      error: 'Failed to find locations',
      message: error.message,
    });
  }
});

/**
 * POST /cashout/:reference/process-payment
 * Process crypto payment (called by webhook or after Stellar tx completes)
 */
router.post('/:reference/process-payment', async (req, res) => {
  try {
    const { stellar_transaction_id } = req.body;

    const result = await moneygramService.processCryptoPayment(
      req.params.reference,
      stellar_transaction_id
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to process payment', error);
    res.status(500).json({
      error: 'Failed to process payment',
      message: error.message,
    });
  }
});

/**
 * POST /cashout/:reference/mark-ready
 * Mark cash-out as ready for pickup (admin/webhook endpoint)
 */
router.post('/:reference/mark-ready', async (req, res) => {
  try {
    const { tracking_number, pin_code, expires_at } = req.body;

    const result = await moneygramService.markReadyForPickup(
      req.params.reference,
      { tracking_number, pin_code, expires_at }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to mark ready for pickup', error);
    res.status(500).json({
      error: 'Failed to update transaction',
      message: error.message,
    });
  }
});

module.exports = router;

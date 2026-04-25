const express = require('express');
const router = express.Router();
const sep31Service = require('../services/sep31');
const sep10Service = require('../services/sep10');
const logger = require('../services/logger');

/**
 * SEP-31: POST /send
 * Create cross-border send transaction
 */
router.post('/send', sep10Service.authenticate, async (req, res) => {
  try {
    const {
      amount,
      sell_asset,
      buy_asset,
      receiver_account,
      receiver_name,
      receiver_country,
      receiver_external_account,
    } = req.body;

    const result = await sep31Service.createSendTransaction({
      amount,
      sell_asset,
      buy_asset,
      sender_account: req.stellarAccount,
      sender_name: 'Authenticated User', // Would come from KYC data
      sender_country: 'US', // Would come from KYC data
      receiver_account,
      receiver_name,
      receiver_country,
      receiver_external_account,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to create send transaction', error);
    res.status(500).json({
      error: 'Failed to initialize send transaction',
      message: error.message,
    });
  }
});

/**
 * SEP-31: GET /transaction/:id
 * Get transaction details
 */
router.get('/transaction/:id', sep10Service.authenticate, async (req, res) => {
  try {
    const transaction = await sep31Service.getTransaction(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    logger.error('Failed to get transaction', error);
    res.status(500).json({
      error: 'Failed to retrieve transaction',
      message: error.message,
    });
  }
});

/**
 * SEP-31: GET /transactions
 * Get all transactions for authenticated account
 */
router.get('/transactions', sep10Service.authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const transactions = await sep31Service.getTransactions(req.stellarAccount, limit);

    res.json({
      success: true,
      data: transactions,
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
 * SEP-31: POST /transaction/:id/compliance
 * Submit compliance information for transaction
 */
router.post('/transaction/:id/compliance', sep10Service.authenticate, async (req, res) => {
  try {
    const complianceData = req.body;

    const result = await sep31Service.processCompliance(
      req.params.id,
      complianceData
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to process compliance', error);
    res.status(500).json({
      error: 'Failed to process compliance',
      message: error.message,
    });
  }
});

module.exports = router;

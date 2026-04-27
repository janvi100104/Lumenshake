const express = require('express');
const router = express.Router();
const sep24Service = require('../services/sep24');
const sep10Service = require('../services/sep10');
const { addExplorerLinks, addExplorerLinksToArray } = require('../utils/explorer');
const logger = require('../services/logger');

/**
 * SEP-24: POST /deposit
 * Initialize interactive deposit
 */
router.post('/deposit', sep10Service.authenticate, async (req, res) => {
  try {
    const { asset_code, asset_issuer, amount, external_account } = req.body;

    const result = await sep24Service.createTransaction({
      kind: 'deposit',
      asset_code,
      asset_issuer,
      stellar_account: req.stellarAccount,
      external_account,
      amount,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to create deposit transaction', error);
    res.status(500).json({
      error: 'Failed to initialize deposit',
      message: error.message,
    });
  }
});

/**
 * SEP-24: POST /withdraw
 * Initialize interactive withdrawal
 */
router.post('/withdraw', sep10Service.authenticate, async (req, res) => {
  try {
    const { asset_code, asset_issuer, amount, external_account } = req.body;

    const result = await sep24Service.createTransaction({
      kind: 'withdrawal',
      asset_code,
      asset_issuer,
      stellar_account: req.stellarAccount,
      external_account,
      amount,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to create withdrawal transaction', error);
    res.status(500).json({
      error: 'Failed to initialize withdrawal',
      message: error.message,
    });
  }
});

/**
 * SEP-24: GET /transaction
 * Get transaction status by ID
 */
router.get('/transaction/:id', sep10Service.authenticate, async (req, res) => {
  try {
    const transaction = await sep24Service.getTransaction(req.params.id);

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
 * SEP-24: GET /transactions
 * Get all transactions for authenticated account
 */
router.get('/transactions', sep10Service.authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const transactions = await sep24Service.getTransactions(req.stellarAccount, limit);

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
 * SEP-24: GET /interactive/:id
 * Interactive deposit/withdrawal page URL
 * This would render a web form in production
 */
router.get('/interactive/:id', async (req, res) => {
  try {
    const transaction = await sep24Service.getTransaction(req.params.id);

    if (!transaction) {
      return res.status(404).send('Transaction not found');
    }

    // In production, this would render an interactive HTML page
    // For now, return JSON with transaction details
    res.json({
      message: 'Interactive payment page',
      transaction,
      instructions: 'In production, this renders a deposit/withdrawal form',
    });
  } catch (error) {
    logger.error('Failed to load interactive page', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;

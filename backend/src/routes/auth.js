const express = require('express');
const router = express.Router();
const sep10Service = require('../services/sep10');
const logger = require('../services/logger');

/**
 * SEP-10: GET /auth
 * Generate challenge transaction for Stellar wallet authentication
 */
router.get('/challenge', (req, res) => {
  try {
    const { account } = req.query;

    if (!account) {
      return res.status(400).json({
        error: 'Missing account parameter',
        message: 'Please provide a Stellar account address (G...)',
      });
    }

    const challengeXdr = sep10Service.generateChallenge(account);

    res.json({
      transaction: challengeXdr,
      network_passphrase: process.env.STELLAR_NETWORK_PASSPHRASE,
    });
  } catch (error) {
    logger.error('Failed to generate challenge', error);
    res.status(500).json({
      error: 'Failed to generate authentication challenge',
      message: error.message,
    });
  }
});

/**
 * SEP-10: POST /auth
 * Verify signed challenge and issue JWT token
 */
router.post('/auth', async (req, res) => {
  try {
    const { transaction } = req.body;

    if (!transaction) {
      return res.status(400).json({
        error: 'Missing transaction',
        message: 'Please provide the signed transaction XDR',
      });
    }

    const result = await sep10Service.verifyChallenge(transaction);

    res.json({
      token: result.token,
      account: result.account,
      expires_in: result.expiresIn,
      token_type: 'Bearer',
    });
  } catch (error) {
    logger.error('Authentication failed', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
});

/**
 * SEP-10: POST /auth/verify
 * Verify existing JWT token (optional utility endpoint)
 */
router.post('/auth/verify', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
      });
    }

    const decoded = sep10Service.verifyToken(token);

    res.json({
      valid: true,
      account: decoded.sub,
      expires_at: new Date(decoded.exp * 1000).toISOString(),
    });
  } catch (error) {
    res.json({
      valid: false,
      error: error.message,
    });
  }
});

module.exports = router;

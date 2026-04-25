const express = require('express');
const router = express.Router();
const sep12Service = require('../services/sep12');
const sep10Service = require('../services/sep10');
const logger = require('../services/logger');

/**
 * SEP-12: GET /customer
 * Get customer information
 */
router.get('/customer', sep10Service.authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    const account = req.stellarAccount;

    const customer = await sep12Service.getCustomer(account, type);

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: 'No customer record exists for this account',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    logger.error('Failed to get customer', error);
    res.status(500).json({
      error: 'Failed to retrieve customer information',
      message: error.message,
    });
  }
});

/**
 * SEP-12: PUT /customer
 * Register or update customer information
 */
router.put('/customer', sep10Service.authenticate, async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      account: req.stellarAccount, // Use authenticated account
    };

    const customer = await sep12Service.registerCustomer(customerData);

    res.json({
      success: true,
      data: customer,
      message: 'Customer information updated successfully',
    });
  } catch (error) {
    logger.error('Failed to register customer', error);
    res.status(400).json({
      error: 'Failed to register customer',
      message: error.message,
    });
  }
});

/**
 * SEP-12: DELETE /customer
 * Delete customer information
 */
router.delete('/customer', sep10Service.authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    const account = req.stellarAccount;

    await sep12Service.deleteCustomer(account, type);

    res.json({
      success: true,
      message: 'Customer information deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete customer', error);
    res.status(500).json({
      error: 'Failed to delete customer',
      message: error.message,
    });
  }
});

/**
 * ADMIN: POST /customer/kyc
 * Update customer KYC status (admin only - would have additional auth in production)
 */
router.post('/customer/kyc', async (req, res) => {
  try {
    const { account, kyc_status, kyc_level, notes } = req.body;

    if (!account || !kyc_status) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'account and kyc_status are required',
      });
    }

    const customer = await sep12Service.updateKYCStatus(
      account,
      kyc_status,
      kyc_level,
      notes
    );

    res.json({
      success: true,
      data: customer,
      message: 'KYC status updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update KYC status', error);
    res.status(400).json({
      error: 'Failed to update KYC status',
      message: error.message,
    });
  }
});

/**
 * GET /customer/kyc/requirements
 * Get KYC requirements for a specific operation
 */
router.get('/customer/kyc/requirements', (req, res) => {
  try {
    const { operation } = req.query;

    if (!operation) {
      return res.status(400).json({
        error: 'Missing operation parameter',
      });
    }

    const requirements = sep12Service.getKYCRequirements(operation);

    res.json({
      success: true,
      data: {
        operation,
        requirements,
      },
    });
  } catch (error) {
    logger.error('Failed to get KYC requirements', error);
    res.status(500).json({
      error: 'Failed to retrieve KYC requirements',
      message: error.message,
    });
  }
});

/**
 * POST /customer/kyc/validate
 * Validate if customer has required KYC for an operation
 */
router.post('/customer/kyc/validate', sep10Service.authenticate, async (req, res) => {
  try {
    const { operation } = req.body;
    const account = req.stellarAccount;

    if (!operation) {
      return res.status(400).json({
        error: 'Missing operation parameter',
      });
    }

    const validation = await sep12Service.validateKYCForOperation(account, operation);

    res.json({
      success: validation.approved,
      data: validation,
    });
  } catch (error) {
    logger.error('Failed to validate KYC', error);
    res.status(500).json({
      error: 'Failed to validate KYC',
      message: error.message,
    });
  }
});

module.exports = router;

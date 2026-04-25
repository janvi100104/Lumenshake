const express = require('express');
const router = express.Router();
const payrollService = require('../services/payroll');
const sep10Service = require('../services/sep10');
const kycGate = require('../middleware/kycGate');
const logger = require('../services/logger');
const Joi = require('joi');

// Validation schemas
const registerEmployerSchema = Joi.object({
  stellar_address: Joi.string().required(),
  kyc_hash: Joi.string().allow('', null),
  tx_hash: Joi.string().required(),
});

const addEmployeeSchema = Joi.object({
  employer_address: Joi.string().required(),
  employee_address: Joi.string().required(),
  salary: Joi.number().integer().positive().required(),
  currency: Joi.string().default('USDC'),
  tx_hash: Joi.string().required(),
});

const runPayrollSchema = Joi.object({
  employer_address: Joi.string().required(),
  period: Joi.number().integer().positive().required(),
  total_amount: Joi.number().integer().positive().required(),
  tx_hash: Joi.string().required(),
});

const claimPayrollSchema = Joi.object({
  employee_address: Joi.string().required(),
  employer_address: Joi.string().required(),
  period: Joi.number().integer().positive().required(),
  amount: Joi.number().integer().positive().required(),
  tx_hash: Joi.string().required(),
});

// Register employer (requires KYC)
router.post('/employers', 
  sep10Service.authenticate,
  kycGate('register_employer'),
  async (req, res) => {
  try {
    const { error, value } = registerEmployerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const employer = await payrollService.registerEmployer(
      value.stellar_address,
      value.kyc_hash,
      value.tx_hash
    );
    
    res.status(201).json({
      success: true,
      data: employer,
    });
  } catch (err) {
    logger.error('Error registering employer', err);
    res.status(500).json({ error: 'Failed to register employer' });
  }
});

// Add employee (requires KYC)
router.post('/employees',
  sep10Service.authenticate,
  kycGate('add_employee'),
  async (req, res) => {
  try {
    const { error, value } = addEmployeeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const employee = await payrollService.addEmployee(
      value.employer_address,
      value.employee_address,
      value.salary,
      value.currency,
      value.tx_hash
    );
    
    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (err) {
    logger.error('Error adding employee', err);
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// Record payroll run (requires KYC)
router.post('/payroll/run',
  sep10Service.authenticate,
  kycGate('run_payroll'),
  async (req, res) => {
  try {
    const { error, value } = runPayrollSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const payroll = await payrollService.recordPayrollRun(
      value.employer_address,
      value.period,
      value.total_amount,
      value.tx_hash
    );
    
    res.status(201).json({
      success: true,
      data: payroll,
    });
  } catch (err) {
    logger.error('Error recording payroll run', err);
    res.status(500).json({ error: 'Failed to record payroll run' });
  }
});

// Record payroll claim (requires KYC)
router.post('/payroll/claim',
  sep10Service.authenticate,
  kycGate('claim_payroll'),
  async (req, res) => {
  try {
    const { error, value } = claimPayrollSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const claim = await payrollService.recordPayrollClaim(
      value.employee_address,
      value.employer_address,
      value.period,
      value.amount,
      value.tx_hash
    );
    
    res.status(201).json({
      success: true,
      data: claim,
    });
  } catch (err) {
    logger.error('Error recording payroll claim', err);
    res.status(500).json({ error: 'Failed to record payroll claim' });
  }
});

// Get employer info
router.get('/employers/:address', async (req, res) => {
  try {
    const employer = await payrollService.getEmployer(req.params.address);
    
    if (!employer) {
      return res.status(404).json({ error: 'Employer not found' });
    }
    
    res.json({
      success: true,
      data: employer,
    });
  } catch (err) {
    logger.error('Error fetching employer', err);
    res.status(500).json({ error: 'Failed to fetch employer' });
  }
});

// Get employee info
router.get('/employees/:employerAddress/:employeeAddress', async (req, res) => {
  try {
    const employee = await payrollService.getEmployee(
      req.params.employerAddress,
      req.params.employeeAddress
    );
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({
      success: true,
      data: employee,
    });
  } catch (err) {
    logger.error('Error fetching employee', err);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Get transactions
router.get('/transactions/:address', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const transactions = await payrollService.getTransactions(req.params.address, limit);
    
    res.json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    logger.error('Error fetching transactions', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction by hash
router.get('/transactions/hash/:txHash', async (req, res) => {
  try {
    const transaction = await payrollService.getTransaction(req.params.txHash);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({
      success: true,
      data: transaction,
    });
  } catch (err) {
    logger.error('Error fetching transaction', err);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

module.exports = router;

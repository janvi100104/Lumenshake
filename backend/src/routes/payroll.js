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

// Universal transaction logger (called after any smart contract transaction)
router.post('/log-transaction', async (req, res) => {
  try {
    const { tx_hash, type, stellar_address, amount, status, metadata } = req.body;
    
    if (!tx_hash || !type || !stellar_address) {
      return res.status(400).json({ error: 'Missing required fields: tx_hash, type, stellar_address' });
    }
    
    // Validate type
    const validTypes = ['add_employee', 'run_payroll', 'claim_payroll', 'register_employer', 'deposit', 'withdrawal'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }
    
    // Insert transaction
    await db.query(
      `INSERT INTO transactions (tx_hash, type, stellar_address, amount, status, completed_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (tx_hash) DO UPDATE SET
         status = EXCLUDED.status,
         completed_at = CURRENT_TIMESTAMP`,
      [tx_hash, type, stellar_address, amount || 0, status || 'success']
    );
    
    logger.info('Transaction logged', {
      tx_hash,
      type,
      stellar_address,
      amount,
      status,
    });
    
    res.json({
      success: true,
      message: 'Transaction logged successfully',
    });
  } catch (err) {
    logger.error('Error logging transaction', err);
    res.status(500).json({ error: 'Failed to log transaction' });
  }
});

// Sync employee to database (called after smart contract transaction)
router.post('/sync-employee', async (req, res) => {
  try {
    const { employer_address, employee_address, salary, currency, tx_hash } = req.body;
    
    if (!employer_address || !employee_address || !salary) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find or create employer
    let employerResult = await db.query(
      'SELECT id FROM employers WHERE stellar_address = $1',
      [employer_address]
    );
    
    let employerId;
    if (employerResult.rows.length === 0) {
      // Employer doesn't exist in DB, create it
      const insertResult = await db.query(
        `INSERT INTO employers (stellar_address, kyc_hash, created_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         RETURNING id`,
        [employer_address, '0000000000000000000000000000000000000000000000000000000000000001']
      );
      employerId = insertResult.rows[0].id;
    } else {
      employerId = employerResult.rows[0].id;
    }
    
    // Convert salary to stroops if it's not already
    const salaryInStroops = salary < 1000000 ? Math.floor(salary * 10_000_000) : salary;
    
    // Insert employee (ignore if already exists)
    await db.query(
      `INSERT INTO employees (employer_id, employee_address, salary, currency, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (employer_id, employee_address) DO NOTHING`,
      [employerId, employee_address, salaryInStroops, currency || 'USDC']
    );
    
    // Log transaction
    if (tx_hash) {
      await db.query(
        `INSERT INTO transactions (tx_hash, type, stellar_address, amount, status, completed_at)
         VALUES ($1, $2, $3, $4, 'success', CURRENT_TIMESTAMP)
         ON CONFLICT (tx_hash) DO NOTHING`,
        [tx_hash, 'add_employee', employee_address, salary]
      );
    }
    
    logger.info('Employee synced to database', {
      employer_address,
      employee_address,
      salary,
    });
    
    res.json({
      success: true,
      message: 'Employee synced successfully',
    });
  } catch (err) {
    logger.error('Error syncing employee', err);
    res.status(500).json({ error: 'Failed to sync employee' });
  }
});

// Get all employees for an employer with KYC status
router.get('/employers/:address/employees', async (req, res) => {
  try {
    let employees = await payrollService.getEmployeesByEmployer(req.params.address);
    
    // If no employees in database, try to sync from smart contract events
    if (employees.length === 0) {
      logger.info('No employees in DB, attempting to sync from contract events');
      
      // Try to fetch recent add_employee transactions and sync them
      try {
        const { SorobanRpc } = require('@stellar/stellar-sdk');
        const rpcUrl = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
        const contractId = process.env.CONTRACT_ID;
        
        if (contractId) {
          const server = new SorobanRpc.Server(rpcUrl);
          
          // Get latest ledger
          const latestLedger = await server.getLatestLedger();
          
          // Search for EmployeeAdded events in recent ledgers
          // This is a simplified approach - in production, use event streaming
          const events = await server.getEvents({
            startLedger: latestLedger.sequence - 1000, // Search last 1000 ledgers
            contractIds: [contractId],
            topicFilters: [[
              Buffer.from('EmployeeAdded').toString('base64')
            ]]
          });
          
          // Sync events to database
          for (const event of events.events) {
            try {
              const eventValue = event.value;
              // Parse event data and insert into DB if not exists
              // This is a placeholder - full implementation needs proper event parsing
              logger.debug('Found EmployeeAdded event', event);
            } catch (err) {
              logger.debug('Error parsing event', err);
            }
          }
          
          // Re-fetch employees after sync attempt
          employees = await payrollService.getEmployeesByEmployer(req.params.address);
        }
      } catch (syncErr) {
        logger.warn('Failed to sync from contract events', syncErr);
      }
    }
    
    // Join with KYC data from SEP-12
    const sep12Service = require('../services/sep12');
    const employeesWithKYC = await Promise.all(
      employees.map(async (emp) => {
        try {
          const kycData = await sep12Service.getCustomer(emp.employee_address);
          const fullName = kycData ? `${kycData.first_name || ''} ${kycData.last_name || ''}`.trim() : '';
          return {
            employee_address: emp.employee_address,
            salary: emp.salary,
            currency: emp.currency,
            kyc_status: kycData?.kyc_status || 'not_started',
            kyc_level: kycData?.kyc_level || 'tier_0',
            name: fullName || 'Unknown',
            email: kycData?.email || null,
          };
        } catch (err) {
          // If KYC lookup fails, return employee with default KYC status
          return {
            employee_address: emp.employee_address,
            salary: emp.salary,
            currency: emp.currency,
            kyc_status: 'not_started',
            kyc_level: 'tier_0',
            name: 'Unknown',
            email: null,
          };
        }
      })
    );
    
    res.json({
      success: true,
      data: employeesWithKYC,
      count: employeesWithKYC.length,
    });
  } catch (err) {
    logger.error('Error fetching employees', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

module.exports = router;

const db = require('../database/db');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

class PayrollService {
  // Register employer and track in database
  async registerEmployer(stellarAddress, kycHash, txHash) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert employer
      const result = await client.query(
        `INSERT INTO employers (stellar_address, kyc_hash)
         VALUES ($1, $2)
         ON CONFLICT (stellar_address) DO UPDATE
         SET kyc_hash = $2, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [stellarAddress, kycHash]
      );
      
      // Log transaction
      await client.query(
        `INSERT INTO transactions (tx_hash, type, stellar_address, status, completed_at)
         VALUES ($1, $2, $3, 'success', CURRENT_TIMESTAMP)`,
        [txHash, 'register_employer', stellarAddress]
      );
      
      // Add to outbox for event processing
      await client.query(
        `INSERT INTO outbox (event_type, payload)
         VALUES ($1, $2)`,
        ['EmployerRegistered', JSON.stringify({
          employer: stellarAddress,
          kyc_hash: kycHash,
          timestamp: new Date().toISOString(),
        })]
      );
      
      await client.query('COMMIT');
      
      logger.audit('Employer registered', {
        stellar_address: stellarAddress,
        tx_hash: txHash,
      });
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to register employer', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Add employee and track in database
  async addEmployee(employerAddress, employeeAddress, salary, currency, txHash) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get employer ID
      const employerResult = await client.query(
        'SELECT id FROM employers WHERE stellar_address = $1',
        [employerAddress]
      );
      
      if (employerResult.rows.length === 0) {
        throw new Error('Employer not found');
      }
      
      const employerId = employerResult.rows[0].id;
      
      // Insert employee
      const result = await client.query(
        `INSERT INTO employees (employer_id, stellar_address, salary, currency)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (employer_id, stellar_address) DO UPDATE
         SET salary = $3, currency = $4, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [employerId, employeeAddress, salary, currency]
      );
      
      // Log transaction
      await client.query(
        `INSERT INTO transactions (tx_hash, type, stellar_address, amount, status, completed_at)
         VALUES ($1, $2, $3, $4, 'success', CURRENT_TIMESTAMP)`,
        [txHash, 'add_employee', employeeAddress, salary]
      );
      
      // Add to outbox
      await client.query(
        `INSERT INTO outbox (event_type, payload)
         VALUES ($1, $2)`,
        ['EmployeeAdded', JSON.stringify({
          employer: employerAddress,
          employee: employeeAddress,
          salary,
          currency,
          timestamp: new Date().toISOString(),
        })]
      );
      
      await client.query('COMMIT');
      
      logger.audit('Employee added', {
        employer_address: employerAddress,
        employee_address: employeeAddress,
        salary,
        tx_hash: txHash,
      });
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to add employee', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Record payroll run
  async recordPayrollRun(employerAddress, period, totalAmount, txHash) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get employer ID
      const employerResult = await client.query(
        'SELECT id FROM employers WHERE stellar_address = $1',
        [employerAddress]
      );
      
      if (employerResult.rows.length === 0) {
        throw new Error('Employer not found');
      }
      
      const employerId = employerResult.rows[0].id;
      
      // Insert payroll period
      const result = await client.query(
        `INSERT INTO payroll_periods (employer_id, period_number, total_amount)
         VALUES ($1, $2, $3)
         ON CONFLICT (employer_id, period_number) DO NOTHING
         RETURNING *`,
        [employerId, period, totalAmount]
      );
      
      // Log transaction
      await client.query(
        `INSERT INTO transactions (tx_hash, type, stellar_address, amount, period_number, status, completed_at)
         VALUES ($1, $2, $3, $4, $5, 'success', CURRENT_TIMESTAMP)`,
        [txHash, 'run_payroll', employerAddress, totalAmount, period]
      );
      
      // Add to outbox
      await client.query(
        `INSERT INTO outbox (event_type, payload)
         VALUES ($1, $2)`,
        ['PayrollRun', JSON.stringify({
          employer: employerAddress,
          period,
          total_amount: totalAmount,
          timestamp: new Date().toISOString(),
        })]
      );
      
      await client.query('COMMIT');
      
      logger.audit('Payroll run', {
        employer_address: employerAddress,
        period,
        total_amount: totalAmount,
        tx_hash: txHash,
      });
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to record payroll run', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Record payroll claim
  async recordPayrollClaim(employeeAddress, employerAddress, period, amount, txHash) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get employee and payroll period
      const employeeResult = await client.query(
        `SELECT e.id, e.employer_id 
         FROM employees e
         JOIN employers emp ON e.employer_id = emp.id
         WHERE e.stellar_address = $1 AND emp.stellar_address = $2`,
        [employeeAddress, employerAddress]
      );
      
      if (employeeResult.rows.length === 0) {
        throw new Error('Employee not found for this employer');
      }
      
      const employeeId = employeeResult.rows[0].id;
      const employerId = employeeResult.rows[0].employer_id;
      
      // Get payroll period
      const periodResult = await client.query(
        'SELECT id FROM payroll_periods WHERE employer_id = $1 AND period_number = $2',
        [employerId, period]
      );
      
      if (periodResult.rows.length === 0) {
        throw new Error('Payroll period not found');
      }
      
      const payrollPeriodId = periodResult.rows[0].id;
      
      // Insert claim
      const result = await client.query(
        `INSERT INTO payroll_claims (employee_id, payroll_period_id, claimed_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (employee_id, payroll_period_id) DO NOTHING
         RETURNING *`,
        [employeeId, payrollPeriodId]
      );
      
      // Mark payroll period as claimed
      await client.query(
        'UPDATE payroll_periods SET is_claimed = TRUE WHERE id = $1',
        [payrollPeriodId]
      );
      
      // Log transaction
      await client.query(
        `INSERT INTO transactions (tx_hash, type, stellar_address, amount, period_number, status, completed_at)
         VALUES ($1, $2, $3, $4, $5, 'success', CURRENT_TIMESTAMP)`,
        [txHash, 'claim_payroll', employeeAddress, amount, period]
      );
      
      // Add to outbox
      await client.query(
        `INSERT INTO outbox (event_type, payload)
         VALUES ($1, $2)`,
        ['PayrollClaimed', JSON.stringify({
          employee: employeeAddress,
          employer: employerAddress,
          period,
          amount,
          timestamp: new Date().toISOString(),
        })]
      );
      
      await client.query('COMMIT');
      
      logger.audit('Payroll claimed', {
        employee_address: employeeAddress,
        employer_address: employerAddress,
        period,
        amount,
        tx_hash: txHash,
      });
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to record payroll claim', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Get employer by stellar address
  async getEmployer(stellarAddress) {
    const result = await db.query(
      'SELECT * FROM employers WHERE stellar_address = $1',
      [stellarAddress]
    );
    return result.rows[0];
  }
  
  // Get employee by stellar address
  async getEmployee(employerAddress, employeeAddress) {
    const result = await db.query(
      `SELECT e.* 
       FROM employees e
       JOIN employers emp ON e.employer_id = emp.id
       WHERE emp.stellar_address = $1 AND e.stellar_address = $2`,
      [employerAddress, employeeAddress]
    );
    return result.rows[0];
  }
  
  // Get payroll period
  async getPayrollPeriod(employerAddress, period) {
    const result = await db.query(
      `SELECT pp.* 
       FROM payroll_periods pp
       JOIN employers emp ON pp.employer_id = emp.id
       WHERE emp.stellar_address = $1 AND pp.period_number = $2`,
      [employerAddress, period]
    );
    return result.rows[0];
  }
  
  // Get transaction by hash
  async getTransaction(txHash) {
    const result = await db.query(
      'SELECT * FROM transactions WHERE tx_hash = $1',
      [txHash]
    );
    return result.rows[0];
  }
  
  // Get all transactions for an address
  async getTransactions(stellarAddress, limit = 50) {
    const result = await db.query(
      `SELECT * FROM transactions 
       WHERE stellar_address = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [stellarAddress, limit]
    );
    return result.rows;
  }
}

module.exports = new PayrollService();

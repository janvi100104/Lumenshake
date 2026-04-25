const db = require('../database/db');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

// KYC Status levels
const KYC_STATUS = {
  NOT_STARTED: 'not_started',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVOKED: 'revoked',
};

// KYC Levels (tiered compliance)
const KYC_LEVELS = {
  TIER_0: 'tier_0', // Basic - no verification
  TIER_1: 'tier_1', // Identity verified
  TIER_2: 'tier_2', // Enhanced due diligence
};

class SEP12Service {
  /**
   * Register or update customer (PUT /customer)
   * @param {object} customerData - Customer information
   * @returns {object} Customer record with status
   */
  async registerCustomer(customerData) {
    const {
      account,
      type, // 'employer' or 'employee'
      first_name,
      last_name,
      email,
      country,
      date_of_birth,
      address,
      city,
      state,
      postal_code,
      phone_number,
      external_id,
    } = customerData;

    try {
      // Validate required fields
      if (!account) {
        throw new Error('Account address is required');
      }

      if (!type || !['employer', 'employee'].includes(type)) {
        throw new Error('Valid type (employer/employee) is required');
      }

      // Upsert customer
      const result = await db.query(
        `INSERT INTO sep12_customers (
          stellar_address, type, first_name, last_name, email,
          country, date_of_birth, address, city, state, postal_code,
          phone_number, external_id, kyc_status, kyc_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (stellar_address, type) DO UPDATE SET
          first_name = COALESCE(EXCLUDED.first_name, sep12_customers.first_name),
          last_name = COALESCE(EXCLUDED.last_name, sep12_customers.last_name),
          email = COALESCE(EXCLUDED.email, sep12_customers.email),
          country = COALESCE(EXCLUDED.country, sep12_customers.country),
          date_of_birth = COALESCE(EXCLUDED.date_of_birth, sep12_customers.date_of_birth),
          address = COALESCE(EXCLUDED.address, sep12_customers.address),
          city = COALESCE(EXCLUDED.city, sep12_customers.city),
          state = COALESCE(EXCLUDED.state, sep12_customers.state),
          postal_code = COALESCE(EXCLUDED.postal_code, sep12_customers.postal_code),
          phone_number = COALESCE(EXCLUDED.phone_number, sep12_customers.phone_number),
          external_id = COALESCE(EXCLUDED.external_id, sep12_customers.external_id),
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
          account, type, first_name, last_name, email,
          country, date_of_birth, address, city, state, postal_code,
          phone_number, external_id, KYC_STATUS.NOT_STARTED, KYC_LEVELS.TIER_0,
        ]
      );

      logger.audit('Customer registered/updated', {
        account,
        type,
        kyc_status: KYC_STATUS.NOT_STARTED,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to register customer', error);
      throw error;
    }
  }

  /**
   * Get customer information (GET /customer)
   * @param {string} account - Stellar account address
   * @param {string} type - Customer type (employer/employee)
   * @returns {object} Customer record
   */
  async getCustomer(account, type) {
    try {
      const query = type
        ? 'SELECT * FROM sep12_customers WHERE stellar_address = $1 AND type = $2'
        : 'SELECT * FROM sep12_customers WHERE stellar_address = $1';
      
      const params = type ? [account, type] : [account];
      const result = await db.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get customer', error);
      throw error;
    }
  }

  /**
   * Delete customer (DELETE /customer)
   * @param {string} account - Stellar account address
   * @param {string} type - Customer type
   */
  async deleteCustomer(account, type) {
    try {
      const query = type
        ? 'DELETE FROM sep12_customers WHERE stellar_address = $1 AND type = $2'
        : 'DELETE FROM sep12_customers WHERE stellar_address = $1';
      
      const params = type ? [account, type] : [account];
      await db.query(query, params);

      logger.audit('Customer deleted', { account, type });
    } catch (error) {
      logger.error('Failed to delete customer', error);
      throw error;
    }
  }

  /**
   * Update KYC status (admin function)
   * @param {string} account - Stellar account address
   * @param {string} kycStatus - New KYC status
   * @param {string} kycLevel - KYC level
   * @param {string} notes - Admin notes
   * @returns {object} Updated customer
   */
  async updateKYCStatus(account, kycStatus, kycLevel = null, notes = null) {
    try {
      if (!Object.values(KYC_STATUS).includes(kycStatus)) {
        throw new Error(`Invalid KYC status: ${kycStatus}`);
      }

      if (kycLevel && !Object.values(KYC_LEVELS).includes(kycLevel)) {
        throw new Error(`Invalid KYC level: ${kycLevel}`);
      }

      const result = await db.query(
        `UPDATE sep12_customers 
         SET kyc_status = $1, 
             kyc_level = COALESCE($2, kyc_level),
             kyc_updated_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE stellar_address = $3
         RETURNING *`,
        [kycStatus, kycLevel, account]
      );

      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }

      // Log KYC change
      await db.query(
        `INSERT INTO sep12_kyc_history (customer_address, old_status, new_status, old_level, new_level, notes)
         SELECT stellar_address, kyc_status, $1, kyc_level, $2, $3
         FROM sep12_customers WHERE stellar_address = $4`,
        [kycStatus, kycLevel, notes, account]
      );

      logger.audit('KYC status updated', {
        account,
        old_status: result.rows[0].kyc_status,
        new_status: kycStatus,
        notes,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update KYC status', error);
      throw error;
    }
  }

  /**
   * Check if customer is approved for payroll operations
   * @param {string} account - Stellar account address
   * @returns {boolean} Whether customer is approved
   */
  async isApprovedForPayroll(account) {
    try {
      const customer = await this.getCustomer(account);
      
      if (!customer) {
        return false;
      }

      return customer.kyc_status === KYC_STATUS.APPROVED;
    } catch (error) {
      logger.error('Failed to check KYC approval', error);
      return false;
    }
  }

  /**
   * Get KYC requirements based on operation type
   * @param {string} operationType - Type of operation
   * @returns {object} Required KYC level and status
   */
  getKYCRequirements(operationType) {
    const requirements = {
      register_employer: {
        status: KYC_STATUS.APPROVED,
        level: KYC_LEVELS.TIER_1,
      },
      add_employee: {
        status: KYC_STATUS.APPROVED,
        level: KYC_LEVELS.TIER_1,
      },
      run_payroll: {
        status: KYC_STATUS.APPROVED,
        level: KYC_LEVELS.TIER_1,
      },
      claim_payroll: {
        status: KYC_STATUS.APPROVED,
        level: KYC_LEVELS.TIER_0, // Basic approval for claiming
      },
      deposit_escrow: {
        status: KYC_STATUS.APPROVED,
        level: KYC_LEVELS.TIER_1,
      },
    };

    return requirements[operationType] || {
      status: KYC_STATUS.APPROVED,
      level: KYC_LEVELS.TIER_0,
    };
  }

  /**
   * Validate customer has required KYC for operation
   * @param {string} account - Stellar account address
   * @param {string} operationType - Type of operation
   * @returns {object} Validation result
   */
  async validateKYCForOperation(account, operationType) {
    const requirements = this.getKYCRequirements(operationType);
    const customer = await this.getCustomer(account);

    if (!customer) {
      return {
        approved: false,
        reason: 'Customer not registered',
        required_status: requirements.status,
        required_level: requirements.level,
      };
    }

    if (customer.kyc_status !== requirements.status) {
      return {
        approved: false,
        reason: `KYC status '${customer.kyc_status}' does not meet requirement '${requirements.status}'`,
        current_status: customer.kyc_status,
        required_status: requirements.status,
      };
    }

    if (customer.kyc_level !== requirements.level) {
      return {
        approved: false,
        reason: `KYC level '${customer.kyc_level}' does not meet requirement '${requirements.level}'`,
        current_level: customer.kyc_level,
        required_level: requirements.level,
      };
    }

    return {
      approved: true,
      customer,
    };
  }
}

module.exports = new SEP12Service();
module.exports.KYC_STATUS = KYC_STATUS;
module.exports.KYC_LEVELS = KYC_LEVELS;

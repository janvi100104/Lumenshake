const sep12Service = require('../services/sep12');
const logger = require('../services/logger');

/**
 * Middleware to gate operations based on KYC compliance status
 * Usage: app.post('/payroll', kycGate('run_payroll'), handler)
 */
const kycGate = (operationType) => {
  return async (req, res, next) => {
    try {
      // Get authenticated account from SEP-10 middleware
      const account = req.stellarAccount;

      if (!account) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate with SEP-10 first',
        });
      }

      // Validate KYC for the requested operation
      const validation = await sep12Service.validateKYCForOperation(account, operationType);

      if (!validation.approved) {
        logger.audit('KYC gate denied', {
          account,
          operation: operationType,
          reason: validation.reason,
        });

        return res.status(403).json({
          error: 'KYC verification required',
          message: validation.reason,
          kyc_status: validation.current_status || validation.required_status,
          kyc_level: validation.current_level || validation.required_level,
          action_required: 'Please complete KYC verification to access this feature',
        });
      }

      // Attach KYC info to request for downstream use
      req.kycValidation = validation;

      next();
    } catch (error) {
      logger.error('KYC gate check failed', error);
      return res.status(500).json({
        error: 'KYC verification failed',
        message: 'Unable to verify compliance status',
      });
    }
  };
};

module.exports = kycGate;

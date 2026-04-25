const { body, param, query, validationResult } = require('express-validator');
const logger = require('../services/logger');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', { errors: errors.array(), ip: req.ip });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// Cash-out initiation validation
const validateCashOut = [
  body('receiver_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Receiver name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Receiver name contains invalid characters'),

  body('receiver_country')
    .isLength({ min: 2, max: 2 })
    .withMessage('Country code must be 2 characters (ISO 3166-1 alpha-2)')
    .matches(/^[A-Z]{2}$/)
    .withMessage('Country code must be uppercase letters'),

  body('receiver_id_type')
    .isIn(['passport', 'national_id', 'drivers_license'])
    .withMessage('Invalid ID type'),

  body('receiver_id_number')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('ID number must be 5-50 characters'),

  body('crypto_amount')
    .isDecimal({ decimal_places: '0,6' })
    .withMessage('Amount must be a valid decimal number')
    .custom((value) => {
      const num = parseFloat(value);
      if (num <= 0) throw new Error('Amount must be greater than 0');
      if (num > 1000000) throw new Error('Amount exceeds maximum (1,000,000 USDC)');
      return true;
    }),

  body('fiat_currency')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency code must be 3 characters (ISO 4217)')
    .matches(/^[A-Z]{3}$/)
    .withMessage('Currency code must be uppercase letters'),

  body('payout_method')
    .optional()
    .isIn(['cash_pickup', 'bank_deposit', 'mobile_wallet'])
    .withMessage('Invalid payout method'),

  handleValidationErrors,
];

// Stellar address validation
const validateStellarAddress = (field) => {
  return body(field)
    .matches(/^G[A-Z0-9]{55}$/)
    .withMessage(`Invalid Stellar address for ${field}`);
};

// Exchange rate validation
const validateExchangeRate = [
  query('base')
    .optional()
    .matches(/^[A-Z]{3,5}$/)
    .withMessage('Invalid base currency code'),

  query('target')
    .matches(/^[A-Z]{3}$/)
    .withMessage('Invalid target currency code'),

  handleValidationErrors,
];

// Transaction ID validation
const validateTransactionId = [
  param('reference')
    .matches(/^MG\d{10,}[A-Z0-9]{5,20}$/)
    .withMessage('Invalid transaction reference format'),

  handleValidationErrors,
];

// Location search validation
const validateLocationSearch = [
  query('country')
    .optional()
    .matches(/^[A-Z]{2}$/)
    .withMessage('Invalid country code'),

  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City name too long'),

  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),

  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),

  query('radius_km')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Radius must be between 1 and 100 km'),

  handleValidationErrors,
];

// SEP-10 authentication validation
const validateAuthChallenge = [
  body('account')
    .matches(/^G[A-Z0-9]{55}$/)
    .withMessage('Invalid Stellar account address'),

  handleValidationErrors,
];

// Customer/KYC validation
const validateCustomerRegistration = [
  body('stellar_address')
    .matches(/^G[A-Z0-9]{55}$/)
    .withMessage('Invalid Stellar address'),

  body('type')
    .isIn(['employer', 'employee'])
    .withMessage('Customer type must be employer or employee'),

  body('first_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required (max 50 characters)'),

  body('last_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required (max 50 characters)'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),

  handleValidationErrors,
];

// Sanitize input to prevent XSS
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

module.exports = {
  validateCashOut,
  validateStellarAddress,
  validateExchangeRate,
  validateTransactionId,
  validateLocationSearch,
  validateAuthChallenge,
  validateCustomerRegistration,
  sanitizeInput,
  handleValidationErrors,
};

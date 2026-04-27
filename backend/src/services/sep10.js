const { 
  StrKey, 
  Keypair, 
  TransactionBuilder, 
  Networks, 
  Operation,
  Account,
  xdr
} = require('@stellar/stellar-sdk');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const logger = require('./logger');

class SEP10Service {
  constructor() {
    this.homeDomain = process.env.HOME_DOMAIN || 'localhost:4000';
    this.webAuthDomain = process.env.WEB_AUTH_DOMAIN || 'LumenShake Payroll';
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtExpiration = process.env.JWT_EXPIRATION || '24h';
    
    // Network configuration
    this.networkPassphrase = process.env.STELLAR_NETWORK === 'testnet' 
      ? Networks.TESTNET 
      : Networks.PUBLIC;
  }

  /**
   * Generate SEP-10 challenge transaction
   * @param {string} accountAddress - Stellar account address (G...)
   * @returns {string} XDR of challenge transaction
   */
  generateChallenge(accountAddress) {
    try {
      // Validate account address
      if (!StrKey.isValidEd25519PublicKey(accountAddress)) {
        throw new Error('Invalid Stellar account address');
      }

      // Generate random 64-byte nonce
      const nonce = this.generateNonce();
      
      // Create challenge transaction
      const account = this.createFakeAccountForChallenge();
      
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
        timebounds: {
          minTime: Math.floor(Date.now() / 1000) - 5,
          maxTime: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes
        },
      })
        .addOperation(
          Operation.manageData({
            name: `${this.homeDomain} auth`,
            value: nonce,
            source: accountAddress,
          })
        )
        .addOperation(
          Operation.manageData({
            name: 'web_auth_domain',
            value: this.webAuthDomain,
            source: account.accountId(),
          })
        )
        .build();

      // Return transaction as XDR
      return transaction.toXDR();
    } catch (error) {
      logger.error('Failed to generate SEP-10 challenge', error);
      throw error;
    }
  }

  /**
   * Verify SEP-10 challenge and issue JWT token
   * @param {string} transactionXdr - Signed transaction XDR
   * @returns {object} JWT token and account info
   */
  /**
   * Verify SEP-10 challenge and issue JWT token
   * @param {string} transactionXdr - Signed transaction XDR
   * @returns {object} JWT token and account info
   */
  async verifyChallenge(transactionXdr) {
    try {
      // Use raw XDR parsing to avoid SDK v15 compatibility issues
      let transaction;
      try {
        // Try standard parsing first
        transaction = TransactionBuilder.fromXDR(transactionXdr, this.networkPassphrase);
      } catch (parseError) {
        // If that fails, try parsing as raw envelope
        logger.warn('Standard XDR parsing failed, trying raw envelope parsing', {
          error: parseError.message
        });
        
        try {
          const envelope = xdr.TransactionEnvelope.fromXDR(transactionXdr, 'base64');
          
          // Extract the transaction from the envelope
          const txV0 = envelope.v0();
          if (txV0) {
            // Reconstruct using TransactionBuilder from raw data
            const tx = txV0.tx();
            const sequenceNumber = tx.seqNum().toString();
            const fee = tx.fee().toString();
            const sourceAccount = tx.sourceAccount().ed25519().toString('hex');
            
            // Convert to proper account ID
            const sourceAccountStr = StrKey.encodeEd25519PublicKey(
              Buffer.concat([Buffer.from([0x30]), tx.sourceAccount().ed25519()])
            );
            
            // Build transaction manually
            const account = new Account(sourceAccountStr, sequenceNumber);
            
            transaction = new TransactionBuilder(account, {
              fee: fee,
              networkPassphrase: this.networkPassphrase,
              timebounds: {
                minTime: tx.timeBounds() ? tx.timeBounds().minTime().toString() : 0,
                maxTime: tx.timeBounds() ? tx.timeBounds().maxTime().toString() : 0,
              },
            });
            
            // Add operations
            for (const op of tx.operations()) {
              const opBody = op.body();
              if (opBody.switch().name === 'manageData') {
                const manageData = opBody.manageDataOp();
                transaction.addOperation(
                  Operation.manageData({
                    name: manageData.dataName(),
                    value: manageData.dataValue(),
                    source: op.sourceAccount() ? 
                      StrKey.encodeEd25519PublicKey(
                        Buffer.concat([Buffer.from([0x30]), op.sourceAccount().accountId().ed25519()])
                      ) : sourceAccountStr,
                  })
                );
              }
            }
            
            transaction = transaction.build();
          } else {
            throw new Error('Unsupported transaction envelope type');
          }
        } catch (rawError) {
          logger.error('Raw XDR parsing also failed', {
            error: rawError.message
          });
          throw new Error(`Invalid XDR format: ${parseError.message}`);
        }
      }
      
      // Validate transaction structure
      this.validateChallengeTransaction(transaction);
      
      // Get client account (source of manage_data operation)
      const clientAccount = this.getClientAccountFromTx(transaction);
      
      // Verify signature
      this.verifyTransactionSignature(transaction, clientAccount);
      
      // Check if nonce has been used (prevent replay attacks)
      const nonce = this.getNonceFromTransaction(transaction);
      await this.checkNonceValidity(nonce);
      
      // Mark nonce as used
      await this.markNonceAsUsed(nonce);
      
      // Generate JWT token
      const token = this.generateJWT(clientAccount);
      
      logger.audit('SEP-10 authentication successful', {
        account: clientAccount,
      });
      
      return {
        token,
        account: clientAccount,
        expiresIn: this.jwtExpiration,
      };
    } catch (error) {
      logger.error('SEP-10 challenge verification failed', error);
      throw error;
    }
  }

  /**
   * Verify JWT token from Authorization header
   * @param {string} token - JWT token
   * @returns {object} Decoded token payload
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      logger.error('JWT verification failed', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate random nonce (64 bytes, base64 encoded)
   */
  generateNonce() {
    const bytes = require('crypto').randomBytes(48);
    return bytes.toString('base64');
  }

  /**
   * Create a fake account for building challenge transactions
   * This is the signing account that doesn't need to exist on-chain
   */
  createFakeAccountForChallenge() {
    const keypair = Keypair.random();
    // Create a proper Account object with sequence number '0'
    return new Account(keypair.publicKey(), '0');
  }

  /**
   * Validate challenge transaction structure
   */
  validateChallengeTransaction(transaction) {
    // Check sequence number is 0
    if (transaction.sequence !== '0') {
      throw new Error('Invalid sequence number');
    }

    // Check timebounds
    const now = Math.floor(Date.now() / 1000);
    if (now < transaction.timeBounds.minTime || now > transaction.timeBounds.maxTime) {
      throw new Error('Transaction timebounds are invalid or expired');
    }

    // Check operations count (should be 1 or 2)
    if (transaction.operations.length < 1 || transaction.operations.length > 2) {
      throw new Error('Invalid number of operations');
    }

    // Check first operation is manage_data
    const firstOp = transaction.operations[0];
    if (firstOp.type !== 'manageData') {
      throw new Error('First operation must be manageData');
    }

    // Check operation name contains home domain
    if (!firstOp.name.includes(this.homeDomain)) {
      throw new Error('Operation name must contain home domain');
    }
  }

  /**
   * Extract client account from transaction
   */
  getClientAccountFromTx(transaction) {
    return transaction.operations[0].source;
  }

  /**
   * Verify transaction signature
   */
  verifyTransactionSignature(transaction, expectedAccount) {
    try {
      const hash = transaction.hash();
      const validSignatures = transaction.signatures.filter((sig) => {
        try {
          const keypair = Keypair.fromPublicKey(expectedAccount);
          keypair.verify(hash, sig.signature());
          return true;
        } catch {
          return false;
        }
      });

      if (validSignatures.length === 0) {
        throw new Error('No valid signatures found');
      }
    } catch (error) {
      throw new Error('Invalid transaction signature');
    }
  }

  /**
   * Extract nonce from transaction
   */
  getNonceFromTransaction(transaction) {
    return transaction.operations[0].value.toString();
  }

  /**
   * Check if nonce has already been used
   */
  async checkNonceValidity(nonce) {
    const result = await db.query(
      'SELECT * FROM sep10_nonces WHERE nonce = $1 AND used = TRUE',
      [nonce]
    );

    if (result.rows.length > 0) {
      throw new Error('Nonce has already been used (replay attack)');
    }
  }

  /**
   * Mark nonce as used to prevent replay attacks
   */
  async markNonceAsUsed(nonce) {
    await db.query(
      `INSERT INTO sep10_nonces (nonce, used, used_at)
       VALUES ($1, TRUE, CURRENT_TIMESTAMP)`,
      [nonce]
    );
  }

  /**
   * Generate JWT token for authenticated account
   */
  generateJWT(accountAddress) {
    const payload = {
      sub: accountAddress,
      iss: this.homeDomain,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      jti: require('uuid').v4(), // Unique token ID
    };

    return jwt.sign(payload, this.jwtSecret, {
      algorithm: 'HS256',
    });
  }

  /**
   * Middleware to authenticate requests with JWT
   */
  authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Missing or invalid Authorization header',
        });
      }

      const token = authHeader.split(' ')[1];
      const decoded = this.verifyToken(token);
      
      // Attach account info to request
      req.stellarAccount = decoded.sub;
      req.jwtPayload = decoded;
      
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: error.message,
      });
    }
  }
}

module.exports = new SEP10Service();

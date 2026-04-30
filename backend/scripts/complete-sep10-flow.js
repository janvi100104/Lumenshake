#!/usr/bin/env node

/**
 * Complete SEP-10 Authentication Flow
 * 
 * This script handles EVERYTHING - generates account, gets challenge, signs, and verifies
 * Uses the EXACT same SDK version as the backend to avoid compatibility issues
 * 
 * Usage:
 *   node complete-sep10-flow.js              # Generate new test account
 *   node complete-sep10-flow.js --existing   # Use existing secret from .env
 */

const { Keypair, TransactionBuilder, Networks, Aion } = require('@stellar/stellar-sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:4000/api';
const NETWORK = Networks.TESTNET;

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║         Complete SEP-10 Authentication Flow             ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

async function completeSEP10Flow() {
  try {
    let keypair;
    let useExisting = process.argv.includes('--existing');

    // Step 1: Get or create account
    if (useExisting) {
      // Load from .env file
      console.log('📝 Loading existing account from .env file...\n');
      
      const envPath = path.join(__dirname, '.env');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/TEST_ACCOUNT_SECRET=(S[A-Z0-9]+)/);
      
      if (!match) {
        console.log('❌ TEST_ACCOUNT_SECRET not found in .env file');
        console.log('\nPlease add this line to your .env file:');
        console.log('TEST_ACCOUNT_SECRET=YOUR_SECRET_KEY_HERE\n');
        process.exit(1);
      }
      
      keypair = Keypair.fromSecret(match[1]);
      console.log(`✅ Loaded account: ${keypair.publicKey()}\n`);
      
    } else {
      // Generate new test account
      console.log('🔑 Step 1: Generating new testnet account...\n');
      keypair = Keypair.random();
      
      console.log(`   Public Key: ${keypair.publicKey()}`);
      console.log(`   Secret Key: ${keypair.secret()}\n`);
      
      // Fund with friendbot
      console.log('💰 Funding account with test lumens...');
      try {
        const friendbotUrl = `https://friendbot.stellar.org?addr=${keypair.publicKey()}`;
        await axios.get(friendbotUrl);
        console.log('✅ Account funded with 10,000 test XLM\n');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log('⚠️  Account already funded (or friendbot rate limited)\n');
        } else {
          console.log('⚠️  Could not fund account (will still work for auth)\n');
        }
      }
    }

    const publicKey = keypair.publicKey();

    // Step 2: Request challenge
    console.log('📡 Step 2: Requesting SEP-10 challenge from backend...');
    console.log(`   URL: ${API_URL}/auth/challenge?account=${publicKey}\n`);

    const challengeResponse = await axios.get(`${API_URL}/auth/challenge`, {
      params: { account: publicKey }
    });

    const challengeXdr = challengeResponse.data.transaction;
    const networkPassphrase = challengeResponse.data.network_passphrase;

    console.log('✅ Challenge received');
    console.log(`   Network: ${networkPassphrase.includes('TESTNET') ? 'Testnet' : 'Mainnet'}`);
    console.log(`   XDR Length: ${challengeXdr.length} characters\n`);

    // Step 3: Sign challenge (using backend's SDK version)
    console.log('✍️  Step 3: Signing challenge with account secret key...');
    
    const transaction = TransactionBuilder.fromXDR(challengeXdr, NETWORK);
    transaction.sign(keypair);
    const signedXdr = transaction.toXDR();

    console.log('✅ Transaction signed successfully\n');

    // Display signed XDR
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  SIGNED TRANSACTION XDR                                 │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(signedXdr);
    console.log('└─────────────────────────────────────────────────────────┘\n');

    // Transaction hash
    const txHash = transaction.hash().toString('hex');
    console.log(`📝 Transaction Hash: ${txHash}\n`);

    // Step 4: Verify and get JWT
    console.log('🔐 Step 4: Verifying challenge and requesting JWT token...');
    console.log(`   URL: ${API_URL}/auth/auth\n`);

    const verifyResponse = await axios.post(`${API_URL}/auth/auth`, {
      transaction: signedXdr
    });

    const token = verifyResponse.data.token;
    const account = verifyResponse.data.account;
    const expiresIn = verifyResponse.data.expires_in;

    console.log('✅ Authentication successful!\n');

    // Display JWT token
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  JWT TOKEN                                              │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(token);
    console.log('└─────────────────────────────────────────────────────────┘\n');

    // Summary
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                    SUMMARY                              ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Account:      ${account.padEnd(42)}║`);
    console.log(`║  Expires:      ${expiresIn.padEnd(42)}║`);
    console.log(`║  Token Type:   Bearer                                   ║`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Save to file
    const outputFile = 'sep10-auth-result.txt';
    const output = `
SEP-10 Authentication Result
=============================
Generated: ${new Date().toISOString()}
Account: ${publicKey}
Network: Testnet
Transaction Hash: ${txHash}

Signed Transaction XDR:
${signedXdr}

JWT Token:
${token}

Token Expires: ${expiresIn}

Usage Example:
  curl -H "Authorization: Bearer ${token}" ${API_URL}/customer?account=${publicKey}

JavaScript Usage:
  const response = await fetch('/api/customer?account=${publicKey}', {
    headers: {
      'Authorization': 'Bearer ${token}'
    }
  });
`;

    fs.writeFileSync(outputFile, output);
    console.log(`💾 Output saved to: ${outputFile}\n`);

    // Step 5: Test the token
    console.log('🧪 Step 5: Testing authenticated endpoint...');
    try {
      const testResponse = await axios.get(`${API_URL}/customer`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { account: publicKey }
      });
      console.log('✅ Authenticated request successful!');
      console.log(`   Response: ${JSON.stringify(testResponse.data).substring(0, 150)}...\n`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('⚠️  Customer endpoint not found (this is OK - auth works!)');
        console.log('   The JWT token is valid and can be used with other endpoints\n');
      } else {
        console.log('⚠️  Test request failed (token is still valid)');
        console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
      }
    }

    console.log('🎉 SEP-10 Authentication Complete!\n');
    console.log('📚 You can now use the JWT token to access protected API endpoints');
    console.log(`   Token: Bearer ${token.substring(0, 30)}...\n`);

    return {
      publicKey,
      secretKey: keypair.secret(),
      signedXdr,
      token,
      account,
      expiresIn,
    };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Hint: Backend server is not running');
      console.error('   Run: cd backend && npm start\n');
    }
    console.error('\n📚 Troubleshooting:');
    console.error('   1. Make sure backend is running: curl http://localhost:4000/health');
    console.error('   2. Check backend logs: tail -f backend/logs/app.log');
    console.error('   3. Verify network is testnet in .env file\n');
    process.exit(1);
  }
}

// Run the complete flow
completeSEP10Flow();

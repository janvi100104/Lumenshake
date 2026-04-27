#!/usr/bin/env node

/**
 * Sign SEP-10 Challenge Transaction
 * 
 * This script signs a SEP-10 challenge transaction with your secret key
 * and optionally verifies it with the backend.
 * 
 * Usage:
 *   node sign-challenge.js --secret <YOUR_SECRET_KEY>
 *   node sign-challenge.js --secret <SECRET> --verify
 */

const { Keypair, TransactionBuilder, Networks } = require('@stellar/stellar-sdk');
const axios = require('axios');

// Parse command line arguments
const args = process.argv.slice(2);
const SECRET_FLAG = args.find(arg => arg === '--secret');
const VERIFY_FLAG = args.includes('--verify');
const API_URL = process.env.API_URL || 'http://localhost:4000/api';

if (!SECRET_FLAG) {
  console.log('❌ Error: Missing --secret flag\n');
  console.log('Usage:');
  console.log('  node sign-challenge.js --secret <YOUR_SECRET_KEY>');
  console.log('  node sign-challenge.js --secret <SECRET> --verify\n');
  console.log('Example:');
  console.log('  node sign-challenge.js --secret SABC123...XYZ');
  console.log('  node sign-challenge.js --secret SABC123...XYZ --verify\n');
  process.exit(1);
}

const SECRET_INDEX = args.indexOf('--secret') + 1;
const SECRET_KEY = args[SECRET_INDEX];

async function signAndVerify() {
  try {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║         SEP-10 Transaction Signer & Verifier            ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Step 1: Get your public key
    console.log('🔑 Step 1: Deriving public key from secret...');
    const keypair = Keypair.fromSecret(SECRET_KEY);
    const publicKey = keypair.publicKey();
    console.log(`   Public Key: ${publicKey}\n`);

    // Step 2: Request fresh challenge
    console.log('📡 Step 2: Requesting fresh challenge from backend...');
    console.log(`   URL: ${API_URL}/auth/challenge?account=${publicKey}\n`);

    const challengeResponse = await axios.get(`${API_URL}/auth/challenge`, {
      params: { account: publicKey }
    });

    const challengeXdr = challengeResponse.data.transaction;
    const networkPassphrase = challengeResponse.data.network_passphrase;

    console.log('✅ Challenge received');
    console.log(`   Network: ${networkPassphrase.includes('TESTNET') ? 'Testnet' : 'Mainnet'}`);
    console.log(`   XDR Length: ${challengeXdr.length} characters\n`);

    // Display challenge XDR
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  UNSIGNED CHALLENGE XDR                                 │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(challengeXdr);
    console.log('└─────────────────────────────────────────────────────────┘\n');

    // Step 3: Sign the transaction
    console.log('✍️  Step 3: Signing transaction with your secret key...');
    
    const transaction = TransactionBuilder.fromXDR(challengeXdr, networkPassphrase);
    transaction.sign(keypair);
    const signedXdr = transaction.toXDR();

    console.log('✅ Transaction signed successfully\n');

    // Display signed XDR
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  SIGNED TRANSACTION XDR (Ready for Submission)          │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(signedXdr);
    console.log('└─────────────────────────────────────────────────────────┘\n');

    // Display transaction hash
    const txHash = transaction.hash().toString('hex');
    console.log(`📝 Transaction Hash: ${txHash}\n`);

    // Step 4: Verify (if requested)
    if (VERIFY_FLAG) {
      console.log('🔐 Step 4: Verifying challenge and requesting JWT token...');
      console.log(`   URL: ${API_URL}/auth/auth\n`);

      const verifyResponse = await axios.post(`${API_URL}/auth/auth`, {
        transaction: signedXdr
      });

      const token = verifyResponse.data.token;
      const account = verifyResponse.data.account;
      const expiresIn = verifyResponse.data.expires_in;

      console.log('✅ Authentication successful!\n');

      console.log('┌─────────────────────────────────────────────────────────┐');
      console.log('│  JWT TOKEN                                              │');
      console.log('├─────────────────────────────────────────────────────────┤');
      console.log(token);
      console.log('└─────────────────────────────────────────────────────────┘\n');

      console.log('╔══════════════════════════════════════════════════════════╗');
      console.log('║                    SUMMARY                              ║');
      console.log('╠══════════════════════════════════════════════════════════╣');
      console.log(`║  Account:      ${account.padEnd(42)}║`);
      console.log(`║  Expires:      ${expiresIn.padEnd(42)}║`);
      console.log(`║  Token Type:   Bearer                                   ║`);
      console.log('╚══════════════════════════════════════════════════════════╝\n');

      // Save to file
      const fs = require('fs');
      const outputFile = 'sep10-signed-output.txt';
      const output = `
SEP-10 Authentication Output
=============================
Generated: ${new Date().toISOString()}
Account: ${publicKey}
Network: ${networkPassphrase.includes('TESTNET') ? 'Testnet' : 'Mainnet'}
Transaction Hash: ${txHash}

Unsigned Challenge XDR:
${challengeXdr}

Signed Transaction XDR:
${signedXdr}

JWT Token:
${token}

Token Expires: ${expiresIn}

Usage Example:
  curl -H "Authorization: Bearer ${token}" ${API_URL}/customer?account=${publicKey}
`;

      fs.writeFileSync(outputFile, output);
      console.log(`💾 Output saved to: ${outputFile}\n`);

      // Test the token
      console.log('🧪 Testing authenticated endpoint...');
      try {
        const testResponse = await axios.get(`${API_URL}/customer`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { account: publicKey }
        });
        console.log('✅ Authenticated request successful!');
        console.log(`   Response: ${JSON.stringify(testResponse.data).substring(0, 100)}...\n`);
      } catch (error) {
        console.log('⚠️  Authenticated request failed (endpoint might not exist yet)');
        console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
      }

    } else {
      console.log('ℹ️  To verify and get JWT token, run:');
      console.log(`   node sign-challenge.js --secret ${SECRET_KEY.substring(0, 10)}... --verify\n`);

      console.log('📋 Or use curl:');
      console.log(`   curl -X POST ${API_URL}/auth/auth \\`);
      console.log('     -H "Content-Type: application/json" \\');
      console.log(`     -d '{"transaction": "${signedXdr}"}'\n`);
    }

    return {
      publicKey,
      challengeXdr,
      signedXdr,
      txHash,
    };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('   Hint: Make sure the backend server is running on port 4000');
      console.error('   Run: cd backend && npm start');
    }
    process.exit(1);
  }
}

// Run the signer
signAndVerify();

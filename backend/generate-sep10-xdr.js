#!/usr/bin/env node

/**
 * SEP-10 Signed Transaction XDR Generator
 * 
 * This tool generates a complete SEP-10 authentication flow and outputs
 * the signed transaction XDR envelope that you can use manually.
 * 
 * Usage:
 *   node generate-sep10-xdr.js                    # Auto-generate with random keypair
 *   node generate-sep10-xdr.js --account <G...>   # Use specific account
 *   node generate-sep10-xdr.js --help             # Show help
 */

const { Keypair, TransactionBuilder, Networks } = require('@stellar/stellar-sdk');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:4000/api';

// Parse command line arguments
const args = process.argv.slice(2);
const HELP = args.includes('--help') || args.includes('-h');
const ACCOUNT_FLAG = args.find(arg => arg === '--account');
const ACCOUNT_INDEX = ACCOUNT_FLAG ? args.indexOf(ACCOUNT_FLAG) + 1 : -1;
const SPECIFIC_ACCOUNT = ACCOUNT_INDEX > 0 ? args[ACCOUNT_INDEX] : null;

if (HELP) {
  console.log(`
SEP-10 Signed Transaction XDR Generator
========================================

Usage:
  node generate-sep10-xdr.js                    # Auto-generate with random keypair
  node generate-sep10-xdr.js --account <G...>   # Use specific Stellar account
  node generate-sep10-xdr.js --api-url <URL>    # Custom API URL
  node generate-sep10-xdr.js --help             # Show this help

Options:
  --account <G...>     Stellar public key to authenticate
  --api-url <URL>      Backend API URL (default: http://localhost:4000/api)
  --help, -h           Show this help message

Output:
  This tool will output:
  1. Challenge XDR (unsigned)
  2. Signed Transaction XDR (ready for submission)
  3. JWT Token (after verification)

Examples:
  # Generate with random test account
  node generate-sep10-xdr.js

  # Use existing account
  node generate-sep10-xdr.js --account GABC123...

  # Custom API URL
  node generate-sep10-xdr.js --api-url https://api.lumenshake.com/api
`);
  process.exit(0);
}

/**
 * Main SEP-10 XDR Generation Flow
 */
async function generateSEP10XDR() {
  try {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║        SEP-10 Signed Transaction XDR Generator          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Step 1: Determine which account to use
    let keypair;
    let accountAddress;

    if (SPECIFIC_ACCOUNT) {
      console.log('📝 Using provided Stellar account...');
      accountAddress = SPECIFIC_ACCOUNT;
      console.log(`   Account: ${accountAddress}`);
      console.log('   ⚠️  Note: You need the secret key to sign this transaction');
      console.log('   ⚠️  This tool will generate the challenge, but you must sign it manually\n');
    } else {
      console.log('📝 Generating random test keypair...');
      keypair = Keypair.random();
      accountAddress = keypair.publicKey();
      console.log(`   Account: ${accountAddress}`);
      console.log(`   Secret:  ${keypair.secret()}`);
      console.log('   ⚠️  Save this secret key to sign transactions!\n');
    }

    // Step 2: Request challenge from backend
    console.log('📡 Step 1: Requesting SEP-10 challenge from backend...');
    console.log(`   URL: ${API_URL}/auth/challenge?account=${accountAddress}\n`);

    const challengeResponse = await axios.get(`${API_URL}/auth/challenge`, {
      params: { account: accountAddress }
    });

    const challengeXdr = challengeResponse.data.transaction;
    const networkPassphrase = challengeResponse.data.network_passphrase;

    console.log('✅ Challenge received');
    console.log(`   Network: ${networkPassphrase.includes('TESTNET') ? 'Testnet' : 'Mainnet'}`);
    console.log(`   XDR Length: ${challengeXdr.length} characters`);
    console.log(`   XDR (first 100 chars): ${challengeXdr.substring(0, 100)}...\n`);

    // Display full challenge XDR
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  UNSIGNED CHALLENGE XDR                                 │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(challengeXdr);
    console.log('└─────────────────────────────────────────────────────────┘\n');

    // Step 3: Sign the transaction
    let signedXdr;

    if (keypair) {
      // We have the secret key - sign automatically
      console.log('✍️  Step 2: Signing challenge with secret key...');
      
      const transaction = TransactionBuilder.fromXDR(challengeXdr, networkPassphrase);
      transaction.sign(keypair);
      signedXdr = transaction.toXDR();

      console.log('✅ Transaction signed successfully\n');
    } else {
      // No secret key - provide instructions for manual signing
      console.log('✍️  Step 2: Manual Signing Required');
      console.log('   Since you provided a public key without the secret,');
      console.log('   you need to sign this transaction using your wallet.\n');
      
      console.log('   Using Freighter Wallet (Browser):');
      console.log('   1. Open browser console');
      console.log('   2. Run: await window.freighter.signTransaction(challengeXdr, networkPassphrase)');
      console.log('   3. Copy the signed XDR result\n');

      console.log('   Using Stellar CLI:');
      console.log('   stellar transaction sign --xdr "<challengeXDR>" --secret-key <SECRET>');
      console.log('   Copy the signed XDR output\n');

      console.log('   Using JavaScript SDK:');
      console.log('   const keypair = Keypair.fromSecret("<SECRET>");');
      console.log('   const tx = TransactionBuilder.fromXDR(challengeXdr, networkPassphrase);');
      console.log('   tx.sign(keypair);');
      console.log('   const signedXdr = tx.toXDR();\n');

      // Ask user to input signed XDR
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      signedXdr = await new Promise((resolve) => {
        readline.question('Enter the signed transaction XDR: ', (answer) => {
          readline.close();
          resolve(answer.trim());
        });
      });
    }

    // Display signed XDR
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  SIGNED TRANSACTION XDR (Ready for Submission)          │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(signedXdr);
    console.log('└─────────────────────────────────────────────────────────┘\n');

    // Step 4: Verify challenge and get JWT
    console.log('🔐 Step 3: Verifying challenge and requesting JWT token...');
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

    // Summary
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                    SUMMARY                              ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Account:      ${account.padEnd(42)}║`);
    console.log(`║  Expires:      ${expiresIn.padEnd(42)}║`);
    console.log(`║  Token Type:   Bearer                                   ║`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Usage examples
    console.log('📚 How to use the JWT token:\n');

    console.log('   cURL:');
    console.log(`   curl -H "Authorization: Bearer ${token.substring(0, 20)}..." \\`);
    console.log(`        ${API_URL.replace('/api', '')}/api/customer?account=${accountAddress}\n`);

    console.log('   JavaScript:');
    console.log('   const response = await fetch("/api/customer?account=' + accountAddress + '", {');
    console.log('     headers: {');
    console.log(`       "Authorization": "Bearer ${token.substring(0, 20)}..."`);
    console.log('   });\n');

    console.log('   Python:');
    console.log('   import requests');
    console.log('   headers = {"Authorization": "Bearer ' + token.substring(0, 20) + '..."}');
    console.log(`   response = requests.get("${API_URL}/customer", headers=headers)\n`);

    // Save to file option
    console.log('💾 Output saved to: sep10-xdr-output.txt\n');

    // Save all outputs to file
    const fs = require('fs');
    const outputFile = 'sep10-xdr-output.txt';
    const output = `
SEP-10 Authentication XDR Output
=================================
Generated: ${new Date().toISOString()}
Account: ${accountAddress}
Network: ${networkPassphrase.includes('TESTNET') ? 'Testnet' : 'Mainnet'}

Unsigned Challenge XDR:
${challengeXdr}

Signed Transaction XDR:
${signedXdr}

JWT Token:
${token}

Token Expires: ${expiresIn}

Usage:
  curl -H "Authorization: Bearer ${token}" http://localhost:4000/api/customer?account=${accountAddress}
`;

    fs.writeFileSync(outputFile, output);
    console.log(`✅ Output saved to ${outputFile}`);

    return {
      challengeXdr,
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
      console.error('   Hint: Make sure the backend server is running on port 4000');
      console.error('   Run: cd backend && npm start');
    }
    process.exit(1);
  }
}

// Run the generator
generateSEP10XDR();

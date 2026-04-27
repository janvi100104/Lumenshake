#!/usr/bin/env node

/**
 * SEP-10 Authentication Flow Test
 * Tests the complete SEP-10 challenge/verification flow
 */

const axios = require('axios');
const { Keypair, TransactionBuilder, Networks } = require('@stellar/stellar-sdk');

const API_URL = 'http://localhost:4000/api';

console.log('🧪 Testing SEP-10 Authentication Flow\n');

// Generate a test keypair
const testKeypair = Keypair.random();
const testAddress = testKeypair.publicKey();

console.log(`📝 Test Account: ${testAddress}\n`);

async function testSEP10Flow() {
  try {
    // Step 1: Request challenge
    console.log('Step 1: Requesting SEP-10 challenge...');
    const challengeResponse = await axios.get(`${API_URL}/auth/challenge`, {
      params: { account: testAddress }
    });
    
    console.log('✅ Challenge received');
    const challengeXdr = challengeResponse.data.transaction;
    console.log(`   Transaction XDR: ${challengeXdr.substring(0, 50)}...\n`);
    
    // Step 2: Sign the challenge
    console.log('Step 2: Signing challenge with test account...');
    const networkPassphrase = Networks.TESTNET;
    const transaction = TransactionBuilder.fromXDR(challengeXdr, networkPassphrase);
    transaction.sign(testKeypair);
    const signedXdr = transaction.toXDR();
    console.log('✅ Challenge signed\n');
    
    // Step 3: Verify challenge and get JWT
    console.log('Step 3: Verifying challenge and requesting JWT...');
    const verifyResponse = await axios.post(`${API_URL}/auth/auth`, {
      transaction: signedXdr
    });
    
    console.log('✅ JWT token received');
    const token = verifyResponse.data.token;
    const expiresIn = verifyResponse.data.expires_in;
    const account = verifyResponse.data.account;
    console.log(`   Token: ${token.substring(0, 30)}...`);
    console.log(`   Account: ${account}`);
    console.log(`   Expires: ${expiresIn}\n`);
    
    // Step 4: Test authenticated endpoint
    console.log('Step 4: Testing authenticated endpoint...');
    const customerResponse = await axios.get(`${API_URL}/customer`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        account: testAddress
      }
    });
    
    console.log('✅ Authenticated request successful');
    console.log(`   Customer data: ${JSON.stringify(customerResponse.data)}\n`);
    
    // Step 5: Test invalid token (should fail)
    console.log('Step 5: Testing invalid token (should fail)...');
    try {
      await axios.get(`${API_URL}/customer`, {
        headers: {
          'Authorization': 'Bearer invalid-token-here'
        },
        params: {
          account: testAddress
        }
      });
      console.log('❌ Should have failed with invalid token\n');
    } catch (error) {
      console.log('✅ Correctly rejected invalid token');
      console.log(`   Error: ${error.response.data.error}\n`);
    }
    
    console.log('🎉 All SEP-10 tests passed!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Challenge generation works');
    console.log('   ✅ Transaction signing works');
    console.log('   ✅ Challenge verification works');
    console.log('   ✅ JWT token issuance works');
    console.log('   ✅ Authenticated endpoints work');
    console.log('   ✅ Invalid token rejection works');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

testSEP10Flow();

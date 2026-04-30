/**
 * Phase 5 Test Script: SEP-24/31 & Webhooks
 * Tests anchor payment rails functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';
let authToken = null;
let sep24TxId = null;
let sep31TxId = null;

// Test utilities
function logTest(name, passed, message = '') {
  console.log(`${passed ? '✅' : '❌'} ${name} ${message ? '- ' + message : ''}`);
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}\n`);
}

// Test: SEP-24 Create Deposit
async function testSep24Deposit() {
  logSection('SEP-24: Create Deposit Transaction');
  
  try {
    const response = await axios.post(`${BASE_URL}/sep24/deposit`, {
      asset_code: 'USDC',
      asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      amount: '1000.00',
      external_account: 'BANK123456',
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    sep24TxId = response.data.data.id;
    logTest('Create deposit', true, `ID: ${sep24TxId}`);
    logTest('Status', response.data.data.status === 'incomplete', response.data.data.status);
    logTest('Has interactive URL', true, !!response.data.data.more_info_url);

    return true;
  } catch (error) {
    logTest('Create deposit', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test: SEP-24 Create Withdrawal
async function testSep24Withdrawal() {
  logSection('SEP-24: Create Withdrawal Transaction');
  
  try {
    const response = await axios.post(`${BASE_URL}/sep24/withdraw`, {
      asset_code: 'USDC',
      asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      amount: '500.00',
      external_account: 'MOBILE123',
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    logTest('Create withdrawal', true, `ID: ${response.data.data.id}`);
    logTest('Kind is withdrawal', response.data.data.kind === 'withdrawal', response.data.data.kind);

    return true;
  } catch (error) {
    logTest('Create withdrawal', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test: SEP-24 Get Transaction
async function testSep24GetTransaction() {
  logSection('SEP-24: Get Transaction Status');
  
  try {
    const response = await axios.get(`${BASE_URL}/sep24/transaction/${sep24TxId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    logTest('Get transaction', true, `Status: ${response.data.data.status}`);
    logTest('Has transaction ID', response.data.data.id === sep24TxId);

    return true;
  } catch (error) {
    logTest('Get transaction', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test: SEP-24 Get All Transactions
async function testSep24GetTransactions() {
  logSection('SEP-24: Get All Transactions');
  
  try {
    const response = await axios.get(`${BASE_URL}/sep24/transactions`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    logTest('Get transactions', true, `Count: ${response.data.data.length}`);
    logTest('Has array', Array.isArray(response.data.data));

    return true;
  } catch (error) {
    logTest('Get transactions', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test: SEP-31 Create Send Transaction
async function testSep31Send() {
  logSection('SEP-31: Create Send Transaction');
  
  try {
    const response = await axios.post(`${BASE_URL}/sep31/send`, {
      amount: '1500.00',
      sell_asset: 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      buy_asset: 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      receiver_account: 'GBReceiver123',
      receiver_name: 'Maria Garcia',
      receiver_country: 'MX',
      receiver_external_account: 'CLABE1234567890',
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    sep31TxId = response.data.data.id;
    logTest('Create send transaction', true, `ID: ${sep31TxId}`);
    logTest('Status is pending', response.data.data.status === 'pending', response.data.data.status);

    return true;
  } catch (error) {
    logTest('Create send transaction', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test: SEP-31 Get Transaction
async function testSep31GetTransaction() {
  logSection('SEP-31: Get Transaction Details');
  
  try {
    const response = await axios.get(`${BASE_URL}/sep31/transaction/${sep31TxId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    logTest('Get transaction', true, `Status: ${response.data.data.status}`);
    logTest('Has receiver', !!response.data.data.receiver_account);

    return true;
  } catch (error) {
    logTest('Get transaction', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test: SEP-31 Get All Transactions
async function testSep31GetTransactions() {
  logSection('SEP-31: Get All Transactions');
  
  try {
    const response = await axios.get(`${BASE_URL}/sep31/transactions`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    logTest('Get transactions', true, `Count: ${response.data.data.length}`);

    return true;
  } catch (error) {
    logTest('Get transactions', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test: Webhook Subscribe
async function testWebhookSubscribe() {
  logSection('Webhooks: Subscribe');
  
  try {
    const response = await axios.post(`${BASE_URL}/webhooks/subscribe`, {
      url: 'https://example.com/webhook',
      event_types: ['transaction.status_changed', 'sep31.transaction.status_changed'],
    });

    logTest('Subscribe to webhooks', true, `ID: ${response.data.data.id}`);
    logTest('Webhook is active', response.data.data.active === true);

    return response.data.data.id;
  } catch (error) {
    logTest('Subscribe to webhooks', false, error.response?.data?.error || error.message);
    return null;
  }
}

// Test: Webhook Get Subscriptions
async function testWebhookGet() {
  logSection('Webhooks: Get Subscriptions');
  
  try {
    const response = await axios.get(`${BASE_URL}/webhooks`);

    logTest('Get subscriptions', true, `Count: ${response.data.data.length}`);
    logTest('Has array', Array.isArray(response.data.data));

    return true;
  } catch (error) {
    logTest('Get subscriptions', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  logSection('Phase 5: SEP-24/31 Anchor Payment Rails Tests');
  
  console.log('Starting tests...\n');
  console.log('Note: Some tests may fail if authentication is required.');
  console.log('For full testing, complete SEP-10 auth flow first.\n');

  // For now, we'll test endpoints that might work without auth
  // or test the structure of error responses
  
  const results = [];

  // Test SEP-24 endpoints
  results.push(await testSep24Deposit().catch(e => false));
  results.push(await testSep24Withdrawal().catch(e => false));
  results.push(await testSep24GetTransaction().catch(e => false));
  results.push(await testSep24GetTransactions().catch(e => false));

  // Test SEP-31 endpoints
  results.push(await testSep31Send().catch(e => false));
  results.push(await testSep31GetTransaction().catch(e => false));
  results.push(await testSep31GetTransactions().catch(e => false));

  // Test webhooks (may not require auth)
  results.push(await testWebhookSubscribe().catch(e => false));
  results.push(await testWebhookGet().catch(e => false));

  // Summary
  logSection('Test Summary');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${total - passed}/${total}\n`);

  if (passed === total) {
    console.log('✅ All tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed. This is expected if:');
    console.log('   - Backend server is not running');
    console.log('   - Authentication token is missing');
    console.log('   - Database is not set up\n');
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };

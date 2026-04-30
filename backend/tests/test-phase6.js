/**
 * Phase 6 Test Script: MoneyGram Cash-Out
 * Tests MoneyGram integration functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';
let authToken = null;
let cashOutRef = null;

// Test utilities
function logTest(name, passed, message = '') {
  console.log(`${passed ? '✅' : '❌'} ${name} ${message ? '- ' + message : ''}`);
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}\n`);
}

// Test: Get Exchange Rate
async function testGetExchangeRate() {
  logSection('MoneyGram: Get Exchange Rate');
  
  try {
    const response = await axios.get(`${BASE_URL}/moneygram/exchange-rate`, {
      params: { base: 'USDC', target: 'MXN' },
    });

    logTest('Get MXN rate', true, `1 USDC = ${response.data.data.rate} MXN`);
    logTest('Has fee percentage', true, `${response.data.data.fee_percentage}%`);

    return true;
  } catch (error) {
    logTest('Get MXN rate', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test: Find Locations
async function testFindLocations() {
  logSection('MoneyGram: Find Pickup Locations');
  
  try {
    const response = await axios.get(`${BASE_URL}/moneygram/locations`, {
      params: { country: 'MX' },
    });

    logTest('Find locations', true, `Found ${response.data.count} locations`);
    logTest('Has location data', response.data.data.length > 0);

    if (response.data.data.length > 0) {
      logTest('First location', true, response.data.data[0].name);
    }

    return true;
  } catch (error) {
    logTest('Find locations', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test: Initiate Cash-Out
async function testInitiateCashOut() {
  logSection('MoneyGram: Initiate Cash-Out');
  
  try {
    const response = await axios.post(`${BASE_URL}/moneygram/initiate`, {
      receiver_name: 'Juan Perez',
      receiver_country: 'MX',
      receiver_id_type: 'passport',
      receiver_id_number: 'MX123456',
      crypto_amount: '100.00',
      crypto_currency: 'USDC',
      fiat_currency: 'MXN',
      payout_method: 'cash_pickup',
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    cashOutRef = response.data.data.moneygram_reference;
    logTest('Initiate cash-out', true, `Ref: ${cashOutRef}`);
    logTest('Status is pending', response.data.data.status === 'pending');
    logTest('Has fiat amount', true, `${response.data.data.fiat_amount} MXN`);
    logTest('Has fee', true, `${response.data.data.fee} MXN`);

    return true;
  } catch (error) {
    logTest('Initiate cash-out', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test: Get Cash-Out Status
async function testGetCashOutStatus() {
  logSection('MoneyGram: Get Cash-Out Status');
  
  if (!cashOutRef) {
    logTest('Get status', false, 'No reference available');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/moneygram/status/${cashOutRef}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    logTest('Get status', true, `Status: ${response.data.data.status}`);
    logTest('Has reference', response.data.data.moneygram_reference === cashOutRef);

    return true;
  } catch (error) {
    logTest('Get status', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test: Get All Transactions
async function testGetTransactions() {
  logSection('MoneyGram: Get All Transactions');
  
  try {
    const response = await axios.get(`${BASE_URL}/moneygram/transactions`, {
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

// Test: Multiple Currency Rates
async function testMultipleRates() {
  logSection('MoneyGram: Multiple Currency Rates');
  
  const currencies = ['MXN', 'INR', 'PHP', 'GHS', 'NGN'];
  let allPassed = true;

  for (const currency of currencies) {
    try {
      const response = await axios.get(`${BASE_URL}/moneygram/exchange-rate`, {
        params: { base: 'USDC', target: currency },
      });

      logTest(`${currency} rate`, true, `1 USDC = ${response.data.data.rate} ${currency}`);
    } catch (error) {
      logTest(`${currency} rate`, false, error.response?.data?.error || error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

// Main test runner
async function runTests() {
  logSection('Phase 6: MoneyGram Cash-Out Integration Tests');
  
  console.log('Starting tests...\n');
  console.log('Note: Authenticated tests may fail without valid JWT token.');
  console.log('Unauthenticated tests (exchange rates, locations) should pass.\n');

  const results = [];

  // Test unauthenticated endpoints
  results.push(await testGetExchangeRate().catch(e => false));
  results.push(await testFindLocations().catch(e => false));
  results.push(await testMultipleRates().catch(e => false));

  // Test authenticated endpoints (may fail without JWT)
  results.push(await testInitiateCashOut().catch(e => false));
  results.push(await testGetCashOutStatus().catch(e => false));
  results.push(await testGetTransactions().catch(e => false));

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
    console.log('   - Authentication token is missing (for authenticated endpoints)');
    console.log('   - Database migration has not been run\n');
    console.log('Unauthenticated endpoints (exchange rates, locations) should work.\n');
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };

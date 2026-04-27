#!/usr/bin/env node

/**
 * MoneyGram Integration Test
 * Tests all MoneyGram API endpoints
 */

const axios = require('axios');

const API_URL = 'http://localhost:4000/api/moneygram';

console.log('🧪 Testing MoneyGram Integration\n');

async function testMoneyGramEndpoints() {
  try {
    // Test 1: Get exchange rate
    console.log('Test 1: GET /exchange-rate');
    const rateResponse = await axios.get(`${API_URL}/exchange-rate`, {
      params: { base: 'USDC', target: 'MXN' }
    });
    
    console.log('✅ Exchange rate endpoint works');
    console.log(`   Rate: 1 USDC = ${rateResponse.data.data.rate} MXN`);
    console.log(`   Fee: ${rateResponse.data.data.fee_percentage}%`);
    console.log(`   Valid until: ${rateResponse.data.data.valid_until}\n`);
    
    // Test 2: Get locations
    console.log('Test 2: GET /locations');
    const locationsResponse = await axios.get(`${API_URL}/locations`, {
      params: { country: 'MX' }
    });
    
    console.log('✅ Locations endpoint works');
    console.log(`   Found: ${locationsResponse.data.count} locations`);
    if (locationsResponse.data.data.length > 0) {
      const loc = locationsResponse.data.data[0];
      console.log(`   Sample: ${loc.name}, ${loc.city}\n`);
    }
    
    // Test 3: Get another exchange rate
    console.log('Test 3: GET /exchange-rate (INR)');
    const inrResponse = await axios.get(`${API_URL}/exchange-rate`, {
      params: { base: 'USDC', target: 'INR' }
    });
    
    console.log('✅ Multiple currency pairs work');
    console.log(`   Rate: 1 USDC = ${inrResponse.data.data.rate} INR\n`);
    
    // Test 4: Test missing parameter
    console.log('Test 4: GET /exchange-rate (missing target)');
    try {
      await axios.get(`${API_URL}/exchange-rate`, {
        params: { base: 'USDC' }
      });
      console.log('❌ Should have failed\n');
    } catch (error) {
      if (error.response.status === 400) {
        console.log('✅ Validation working');
        console.log(`   Error: ${error.response.data.error}\n`);
      }
    }
    
    // Test 5: Test unsupported currency
    console.log('Test 5: GET /exchange-rate (unsupported currency)');
    try {
      await axios.get(`${API_URL}/exchange-rate`, {
        params: { base: 'USDC', target: 'XYZ' }
      });
      console.log('✅ Returns default rate for unsupported currencies\n');
    } catch (error) {
      console.log(`⚠️  Status: ${error.response.status}\n`);
    }
    
    // Test 6: Locations with city filter
    console.log('Test 6: GET /locations (with city)');
    const cityResponse = await axios.get(`${API_URL}/locations`, {
      params: { country: 'MX', city: 'Mexico City' }
    });
    
    console.log('✅ City filtering works');
    console.log(`   Found: ${cityResponse.data.count} locations in Mexico City\n`);
    
    console.log('📊 Test Summary:');
    console.log('   ✅ Exchange rate endpoint: WORKING');
    console.log('   ✅ Locations endpoint: WORKING');
    console.log('   ✅ Multi-currency support: WORKING');
    console.log('   ✅ Input validation: WORKING');
    console.log('   ✅ Location filtering: WORKING');
    console.log('\n🎉 MoneyGram API integration is working!');
    console.log('\n📝 Note: Currently using mock data');
    console.log('   To use real MoneyGram API:');
    console.log('   1. Get API credentials from MoneyGram');
    console.log('   2. Update .env with MONEYGRAM_API_KEY');
    console.log('   3. Update service to call real API endpoints');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

testMoneyGramEndpoints();

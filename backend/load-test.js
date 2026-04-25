/**
 * Load Testing Script for LumenShake Backend
 * Uses autocannon for HTTP load testing
 * 
 * Install: npm install -D autocannon
 * Run: node load-test.js
 */

const autocannon = require('autocannon');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// Test configurations
const tests = [
  {
    name: 'Health Check Endpoint',
    url: '/health',
    method: 'GET',
    connections: 10,
    pipelining: 1,
    duration: 10, // seconds
  },
  {
    name: 'Exchange Rate Lookup',
    url: '/api/moneygram/exchange-rate?base=USDC&target=MXN',
    method: 'GET',
    connections: 50,
    pipelining: 1,
    duration: 20,
  },
  {
    name: 'Location Search',
    url: '/api/moneygram/locations?country=MX',
    method: 'GET',
    connections: 50,
    pipelining: 1,
    duration: 20,
  },
];

async function runTest(testConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${testConfig.name}`);
  console.log(`${'='.repeat(60)}`);

  const instance = autocannon({
    url: `${BASE_URL}${testConfig.url}`,
    method: testConfig.method,
    connections: testConfig.connections,
    pipelining: testConfig.pipelining,
    duration: testConfig.duration,
    headers: {
      'Content-Type': 'application/json',
    },
  }, (err, result) => {
    if (err) {
      console.error('Test failed:', err.message);
      return;
    }

    console.log('\n📊 Results:');
    console.log(`  Requests: ${result.requests.total} total, ${result.requests.average} avg/sec`);
    console.log(`  Latency: ${result.latency.mean}ms avg, ${result.latency.p99}ms p99`);
    console.log(`  Throughput: ${(result.throughput.average / 1024).toFixed(2)} KB/sec`);
    
    const successRate = ((result.codes['200'] || 0) / result.requests.total * 100).toFixed(2);
    console.log(`  Success Rate: ${successRate}%`);
    
    if (result.timeouts > 0) {
      console.log(`  ⚠️  Timeouts: ${result.timeouts}`);
    }

    if (result.non2xx > 0) {
      console.log(`  ⚠️  Non-2xx responses: ${result.non2xx}`);
    }
  });

  return instance;
}

async function runAllTests() {
  console.log('🚀 Starting Load Tests for LumenShake Backend');
  console.log(`Target: ${BASE_URL}\n`);

  for (const test of tests) {
    await new Promise((resolve) => {
      runTest(test).on('done', resolve);
    });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n✅ Load testing completed!');
  console.log('\n💡 Tips:');
  console.log('  - Monitor server CPU/memory during tests');
  console.log('  - Check database connection pool usage');
  console.log('  - Review rate limiting effectiveness');
  console.log('  - Verify no memory leaks in long-running tests');
}

// Run if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runTest, runAllTests };

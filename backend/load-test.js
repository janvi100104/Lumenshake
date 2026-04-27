/**
 * Load Testing Script for LumenShake Backend
 * Uses autocannon for HTTP load testing
 * 
 * Install: npm install -D autocannon
 * Run: node load-test.js
 */

const autocannon = require('autocannon');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// Test configurations - Optimized for 30+ concurrent users
const tests = [
  {
    name: '🏥 Health Check Endpoint (30 concurrent users)',
    url: '/health',
    method: 'GET',
    connections: 30,
    pipelining: 1,
    duration: 30, // seconds
  },
  {
    name: '💱 Exchange Rate Lookup (30 concurrent users)',
    url: '/api/moneygram/exchange-rate?base=USDC&target=MXN',
    method: 'GET',
    connections: 30,
    pipelining: 1,
    duration: 30,
  },
  {
    name: '📍 Location Search (30 concurrent users)',
    url: '/api/moneygram/locations?country=MX',
    method: 'GET',
    connections: 30,
    pipelining: 1,
    duration: 30,
  },
  {
    name: '📊 Metrics Dashboard (30 concurrent users)',
    url: '/api/metrics/dashboard',
    method: 'GET',
    connections: 30,
    pipelining: 1,
    duration: 30,
  },
  {
    name: '🔥 Stress Test - 50 concurrent users (Health)',
    url: '/health',
    method: 'GET',
    connections: 50,
    pipelining: 1,
    duration: 60,
  },
];

async function runTest(testConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${testConfig.name}`);
  console.log(`${'='.repeat(60)}`);

  return new Promise((resolve, reject) => {
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
        console.error('❌ Test failed:', err.message);
        reject(err);
        return;
      }

      console.log('\n📊 Results:');
      console.log(`  ⚡ Requests: ${result.requests.total} total, ${result.requests.average} avg/sec`);
      console.log(`  ⏱️  Latency: ${result.latency.mean}ms avg, ${result.latency.p99 || 'N/A'}ms p99, ${result.latency.p95 || 'N/A'}ms p95`);
      console.log(`  📈 Throughput: ${(result.throughput.average / 1024).toFixed(2)} KB/sec`);
      
      const totalRequests = result.requests.total;
      const successfulRequests = result.codes?.['200'] || 0;
      const successRate = totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(2) : '0.00';
      console.log(`  ✅ Success Rate: ${successRate}%`);
      
      if (result.timeouts > 0) {
        console.log(`  ⚠️  Timeouts: ${result.timeouts}`);
      }

      if (result.non2xx > 0) {
        console.log(`  ⚠️  Non-2xx responses: ${result.non2xx}`);
      }

      // Performance evaluation
      console.log('\n🎯 Performance Evaluation:');
      const p99 = result.latency.p99 || 0;
      if (p99 < 100) {
        console.log('  ✅ Excellent: P99 latency < 100ms');
      } else if (p99 < 500) {
        console.log('  ✅ Good: P99 latency < 500ms');
      } else if (p99 < 1000) {
        console.log('  ⚠️  Acceptable: P99 latency < 1s');
      } else {
        console.log('  ❌ Poor: P99 latency > 1s - optimization needed');
      }

      if (parseFloat(successRate) >= 99) {
        console.log('  ✅ Excellent: Success rate >= 99%');
      } else if (parseFloat(successRate) >= 95) {
        console.log('  ⚠️  Acceptable: Success rate >= 95%');
      } else {
        console.log('  ❌ Poor: Success rate < 95% - optimization needed');
      }

      resolve(result);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting Load Tests for LumenShake Backend');
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log(`👥 Simulating: 30-50 concurrent users\n`);

  const results = [];

  for (const test of tests) {
    try {
      const result = await runTest(test);
      results.push({ name: test.name, result });
    } catch (err) {
      console.error(`Failed: ${test.name}`, err.message);
    }
    
    // Wait between tests to allow system to recover
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 LOAD TEST SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(({ name, result }) => {
    console.log(`\n${name}`);
    console.log(`  Requests: ${result.requests.total} (${result.requests.average}/sec)`);
    console.log(`  P99 Latency: ${result.latency.p99 || 'N/A'}ms`);
    const totalReq = result.requests.total;
    const successReq = result.codes?.['200'] || 0;
    const successRate = totalReq > 0 ? ((successReq / totalReq) * 100).toFixed(2) : '0.00';
    console.log(`  Success Rate: ${successRate}%`);
  });

  console.log('\n✅ Load testing completed!');
  console.log('\n💡 Optimization Tips:');
  console.log('  - Monitor server CPU/memory during tests');
  console.log('  - Check database connection pool usage');
  console.log('  - Review rate limiting effectiveness');
  console.log('  - Verify no memory leaks in long-running tests');
  console.log('  - Consider adding caching for frequently accessed data');
  console.log('  - Optimize database queries with proper indexing');
  
  return results;
}

// Run if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runTest, runAllTests };

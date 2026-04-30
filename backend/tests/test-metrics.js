#!/usr/bin/env node

/**
 * Test Metrics Service
 */

const metricsService = require('../src/services/metrics');
const db = require('../src/database/db');

async function testMetrics() {
  console.log('🧪 Testing Metrics Service\n');

  try {
    // Test 1: System Metrics
    console.log('Test 1: Get System Metrics');
    const systemMetrics = await metricsService.getSystemMetrics();
    console.log('✅ System metrics retrieved');
    console.log(`   Users: ${systemMetrics.users.total.total}`);
    console.log(`   Transactions: ${systemMetrics.transactions.counts.total}`);
    console.log(`   Database: ${systemMetrics.system.database}\n`);

    // Test 2: User Metrics
    console.log('Test 2: Get User Metrics');
    const userMetrics = await metricsService.getUserMetrics();
    console.log('✅ User metrics retrieved');
    console.log(`   Employers: ${userMetrics.total.employers}`);
    console.log(`   Employees: ${userMetrics.total.employees}`);
    console.log(`   KYC Approved: ${userMetrics.total.kyc_approved}\n`);

    // Test 3: Transaction Metrics
    console.log('Test 3: Get Transaction Metrics');
    const txMetrics = await metricsService.getTransactionMetrics();
    console.log('✅ Transaction metrics retrieved');
    console.log(`   Payroll Claims: ${txMetrics.counts.payroll_claims}`);
    console.log(`   MoneyGram: ${txMetrics.counts.moneygram}`);
    console.log(`   Success Rate: ${txMetrics.success_rate}%\n`);

    // Test 4: Financial Metrics
    console.log('Test 4: Get Financial Metrics');
    const financialMetrics = await metricsService.getFinancialMetrics();
    console.log('✅ Financial metrics retrieved');
    console.log(`   Payroll Volume: $${financialMetrics.payroll.total_volume}`);
    console.log(`   Cashout Volume: $${financialMetrics.cashout.total_crypto}\n`);

    // Test 5: System Health
    console.log('Test 5: Get System Health');
    const healthMetrics = await metricsService.getSystemHealthMetrics();
    console.log('✅ Health metrics retrieved');
    console.log(`   Database: ${healthMetrics.database}`);
    console.log(`   Webhook Success Rate: ${healthMetrics.webhooks.success_rate}%`);
    console.log(`   Uptime: ${(healthMetrics.uptime / 60).toFixed(2)} minutes\n`);

    // Test 6: Historical Metrics
    console.log('Test 6: Get Historical Metrics (7 days)');
    const historicalMetrics = await metricsService.getHistoricalMetrics(7);
    console.log('✅ Historical metrics retrieved');
    console.log(`   Data points: ${historicalMetrics.user_signups.length}\n`);

    // Test 7: Complete Dashboard
    console.log('Test 7: Get Complete Dashboard');
    const dashboard = await metricsService.getMetricsByTimeRange(30);
    console.log('✅ Dashboard data retrieved');
    console.log(`   Sections: ${Object.keys(dashboard).join(', ')}\n`);

    console.log('📊 Test Summary:');
    console.log('   ✅ System metrics: WORKING');
    console.log('   ✅ User metrics: WORKING');
    console.log('   ✅ Transaction metrics: WORKING');
    console.log('   ✅ Financial metrics: WORKING');
    console.log('   ✅ Health metrics: WORKING');
    console.log('   ✅ Historical metrics: WORKING');
    console.log('   ✅ Dashboard: WORKING');
    console.log('\n🎉 Metrics service is working perfectly!');

    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    await db.pool.end();
    process.exit(1);
  }
}

testMetrics();

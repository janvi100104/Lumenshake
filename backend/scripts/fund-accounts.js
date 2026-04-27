#!/usr/bin/env node

/**
 * Fund Test Accounts
 * Funds employer and worker accounts with testnet XLM for gas fees
 */

const { Keypair, Networks, Horizon } = require('@stellar/stellar-sdk');
const db = require('../src/database/db');
const axios = require('axios');

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIEND_BOT_URL = 'https://friendbot.stellar.org';

/**
 * Fund account using Friendbot
 */
async function fundAccount(publicKey) {
  try {
    const response = await axios.get(`${FRIEND_BOT_URL}?addr=${publicKey}`);
    
    if (response.status === 200) {
      return true;
    }
    return false;
  } catch (error) {
    // Account might already be funded
    if (error.response?.status === 400) {
      return true; // Already exists
    }
    console.error(`   ⚠️  Failed to fund ${publicKey}: ${error.message}`);
    return false;
  }
}

/**
 * Get all user accounts from database
 */
async function getAllAccounts() {
  const result = await db.query(`
    SELECT stellar_address, 'employer' as type, company_name as name 
    FROM employers
    UNION ALL
    SELECT stellar_address, 'worker' as type, first_name || ' ' || last_name as name
    FROM workers
    ORDER BY type, name
  `);
  
  return result.rows;
}

/**
 * Check account balance
 */
async function checkBalance(publicKey) {
  try {
    const horizon = new Horizon.Server(HORIZON_URL);
    const account = await horizon.accounts(publicKey).call();
    
    const xlmBalance = account.balances.find(b => b.asset_type === 'native');
    return xlmBalance ? parseFloat(xlmBalance.balance) : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Fund all accounts
 */
async function fundAllAccounts() {
  console.log('💰 Funding Test Accounts with Testnet XLM\n');
  
  const accounts = await getAllAccounts();
  console.log(`Found ${accounts.length} accounts to fund\n`);
  
  let funded = 0;
  let failed = 0;
  let alreadyFunded = 0;
  
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    
    // Check if already funded
    const balance = await checkBalance(account.stellar_address);
    
    if (balance > 0) {
      console.log(`✅ ${i + 1}/${accounts.length} ${account.name} (${account.type}) - Already funded: ${balance} XLM`);
      alreadyFunded++;
      continue;
    }
    
    // Fund account
    console.log(`💸 ${i + 1}/${accounts.length} ${account.name} (${account.type}) - Funding...`);
    const success = await fundAccount(account.stellar_address);
    
    if (success) {
      const newBalance = await checkBalance(account.stellar_address);
      console.log(`   ✅ Funded: ${newBalance} XLM`);
      funded++;
    } else {
      console.log(`   ❌ Failed`);
      failed++;
    }
    
    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💰 FUNDING SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Already funded: ${alreadyFunded}`);
  console.log(`✅ Newly funded: ${funded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total accounts: ${accounts.length}`);
  console.log('='.repeat(60));
}

// Run if called directly
if (require.main === module) {
  fundAllAccounts()
    .then(() => db.pool.end())
    .catch(error => {
      console.error('❌ Failed:', error);
      db.pool.end();
      process.exit(1);
    });
}

module.exports = { fundAllAccounts, fundAccount };

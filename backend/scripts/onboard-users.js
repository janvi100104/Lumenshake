#!/usr/bin/env node

/**
 * User Onboarding Script
 * Creates test users (employers and workers) for testing and demo
 * Generates 30+ verified active users with realistic data
 */

const { Keypair } = require('@stellar/stellar-sdk');
const db = require('../src/database/db');
const logger = require('../src/services/logger');
const { v4: uuidv4 } = require('uuid');

// Sample data for realistic user generation
const FIRST_NAMES = [
  'James', 'Maria', 'Ahmed', 'Wei', 'Priya', 'Carlos', 'Fatima', 'John',
  'Yuki', 'Amara', 'Miguel', 'Sofia', 'Raj', 'Elena', 'Omar', 'Lisa',
  'Chen', 'Aisha', 'Roberto', 'Mei', 'David', 'Sakura', 'Ali', 'Anna',
  'Luis', 'Hassan', 'Nina', 'Pedro', 'Zara', 'Michael', 'Layla', 'Thomas'
];

const LAST_NAMES = [
  'Smith', 'Garcia', 'Khan', 'Wang', 'Patel', 'Rodriguez', 'Hassan', 'Johnson',
  'Tanaka', 'Okafor', 'Hernandez', 'Lopez', 'Sharma', 'Popov', 'Ali', 'Chen',
  'Kim', 'Singh', 'Santos', 'Zhang', 'Williams', 'Yamamoto', 'Ahmed', 'Mueller',
  'Martinez', 'Mohammed', 'Ivanova', 'Silva', 'Abdi', 'Brown', 'Hasan', 'Taylor'
];

const COUNTRIES = [
  { code: 'US', name: 'United States', phone: '+1' },
  { code: 'MX', name: 'Mexico', phone: '+52' },
  { code: 'IN', name: 'India', phone: '+91' },
  { code: 'PH', name: 'Philippines', phone: '+63' },
  { code: 'NG', name: 'Nigeria', phone: '+234' },
  { code: 'GH', name: 'Ghana', phone: '+233' },
  { code: 'BR', name: 'Brazil', phone: '+55' },
  { code: 'CN', name: 'China', phone: '+86' },
];

const COMPANIES = [
  'TechCorp Solutions', 'GlobalTrade Inc', 'FarmFresh Co', 'BuildRight Construction',
  'HealthFirst Medical', 'EduSmart Academy', 'GreenEnergy Ltd', 'FastLogistics Corp',
  'DataSync Technologies', 'CloudNine Services', 'SilverLine Manufacturing', 'AquaPure Systems',
  'MetaWorks Digital', 'BrightFuture Education', 'EcoGrow Agriculture', 'SwiftPay Financial'
];

const CITIES = {
  US: ['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle'],
  MX: ['Mexico City', 'Guadalajara', 'Monterrey', 'Cancun', 'Puebla'],
  IN: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'],
  PH: ['Manila', 'Cebu', 'Davao', 'Quezon City', 'Makati'],
  NG: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'],
  GH: ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Takoradi'],
  BR: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia', 'Salvador', 'Fortaleza'],
  CN: ['Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou', 'Chengdu'],
};

/**
 * Generate random item from array
 */
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate random number in range
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate Stellar keypair
 */
function generateKeypair() {
  return Keypair.random();
}

/**
 * Create employer users
 */
async function createEmployers(count) {
  console.log(`\n📊 Creating ${count} employers...\n`);
  const employers = [];

  for (let i = 0; i < count; i++) {
    const keypair = generateKeypair();
    const firstName = randomFrom(FIRST_NAMES);
    const lastName = randomFrom(LAST_NAMES);
    const company = COMPANIES[i % COMPANIES.length];

    try {
      const result = await db.query(
        `INSERT INTO employers (stellar_address, is_paused)
         VALUES ($1, $2)
         RETURNING *`,
        [
          keypair.publicKey(),
          false,
        ]
      );

      employers.push({
        ...result.rows[0],
        secret: keypair.secret(),
        company_name: company,
        contact_name: `${firstName} ${lastName}`,
      });

      console.log(`✅ Employer ${i + 1}/${count}: ${company} (${keypair.publicKey().slice(0, 8)}...)`);
    } catch (error) {
      console.error(`❌ Failed to create employer ${i + 1}:`, error.message);
    }
  }

  return employers;
}

/**
 * Create worker/employee users
 */
async function createWorkers(count, employers) {
  console.log(`\n👷 Creating ${count} workers and linking to employers...\n`);
  const workers = [];
  let employeesCreated = 0;

  for (let i = 0; i < count; i++) {
    const keypair = generateKeypair();
    const firstName = randomFrom(FIRST_NAMES);
    const lastName = randomFrom(LAST_NAMES);
    const country = randomFrom(COUNTRIES);
    const city = randomFrom(CITIES[country.code]);
    
    // Assign to random employer
    const employer = randomFrom(employers);

    try {
      // Create employee record
      const result = await db.query(
        `INSERT INTO employees (employer_id, stellar_address, salary, currency)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          employer.id,
          keypair.publicKey(),
          randomInt(2000, 8000), // Monthly salary in USDC
          'USDC',
        ]
      );

      workers.push({
        ...result.rows[0],
        secret: keypair.secret(),
        first_name: firstName,
        last_name: lastName,
        country: country.code,
        city: city,
      });

      employeesCreated++;
      console.log(`✅ Worker ${i + 1}/${count}: ${firstName} ${lastName} → ${employer.company_name}`);
    } catch (error) {
      console.error(`❌ Failed to create worker ${i + 1}:`, error.message);
    }
  }

  console.log(`\n📊 Total employees created: ${employeesCreated}`);
  return workers;
}

/**
 * Link workers to employers - Already done in createWorkers
 */
async function linkWorkersToEmployers(employers, workers) {
  console.log('\n🔗 Workers already linked during creation\n');
  return workers.length;
}

/**
 * Generate customer/KYC records for SEP-12
 */
async function createKYCRecords(employers, workers) {
  console.log('\n📋 Creating SEP-12 KYC records...\n');
  let kycCreated = 0;

  const allUsers = [
    ...employers.map(e => ({ 
      stellar_address: e.stellar_address, 
      type: 'employer',
      first_name: e.contact_name.split(' ')[0],
      last_name: e.contact_name.split(' ').slice(1).join(' '),
    })),
    ...workers.map(w => ({ 
      stellar_address: w.stellar_address, 
      type: 'employee',
      first_name: w.first_name,
      last_name: w.last_name,
    })),
  ];

  for (const user of allUsers) {
    try {
      const result = await db.query(
        `INSERT INTO sep12_customers (
          stellar_address, type, first_name, last_name, kyc_status, kyc_level
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          user.stellar_address,
          user.type,
          user.first_name,
          user.last_name,
          'APPROVED',
          'FULL',
        ]
      );
      kycCreated++;
    } catch (error) {
      // Skip if already exists
      if (error.code !== '23505') {
        console.error(`❌ Failed to create KYC for ${user.stellar_address}:`, error.message);
      }
    }
  }

  console.log(`✅ Created ${kycCreated} KYC records`);
  return kycCreated;
}

/**
 * Display summary
 */
async function displaySummary(employers, workers) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 USER ONBOARDING SUMMARY');
  console.log('='.repeat(60));

  // Get stats from database
  const stats = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM employers) as total_employers,
      (SELECT COUNT(*) FROM employees) as total_employees,
      (SELECT COUNT(*) FROM sep12_customers WHERE kyc_status = 'APPROVED') as verified_users
  `);

  const { total_employers, total_employees, verified_users } = stats.rows[0];

  console.log(`\n✅ Total Employers: ${total_employers}`);
  console.log(`✅ Total Employees/Workers: ${total_employees}`);
  console.log(`✅ Verified Users (SEP-12 KYC): ${verified_users}`);
  console.log(`✅ Total Active Users: ${parseInt(total_employers) + parseInt(total_employees)}`);

  console.log('\n💼 Sample Employers:');
  for (const emp of employers.slice(0, 5)) {
    console.log(`   - ${emp.company_name} (${emp.contact_name})`);
  }

  console.log('\n👷 Sample Workers:');
  for (const worker of workers.slice(0, 5)) {
    console.log(`   - ${worker.first_name} ${worker.last_name} (Salary: ${worker.salary} ${worker.currency})`);
  }

  console.log('\n🔐 Credentials:');
  console.log('   - All Stellar keypairs generated');
  console.log('   - Save secrets securely for testing');
  console.log('   - Use public keys for API interactions');

  console.log('\n📝 Test Account Addresses:');
  console.log('\nEmployers:');
  employers.forEach((emp, i) => {
    console.log(`  ${i + 1}. ${emp.stellar_address}`);
  });
  
  console.log('\nWorkers (first 10):');
  workers.slice(0, 10).forEach((worker, i) => {
    console.log(`  ${i + 1}. ${worker.stellar_address}`);
  });

  console.log('\n' + '='.repeat(60));
}

/**
 * Main onboarding function
 */
async function onboardUsers() {
  console.log('🚀 Starting User Onboarding Process...\n');
  console.log('This will create 30+ verified users for testing and demo purposes.\n');

  try {
    // Create 10 employers and 25 workers (35 total users)
    const NUM_EMPLOYERS = 10;
    const NUM_WORKERS = 25;

    const employers = await createEmployers(NUM_EMPLOYERS);
    const workers = await createWorkers(NUM_WORKERS, employers);
    await linkWorkersToEmployers(employers, workers);
    await createKYCRecords(employers, workers);
    await displaySummary(employers, workers);

    console.log('\n✅ User onboarding complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Fund test accounts with testnet XLM');
    console.log('   2. Create USDC trustlines');
    console.log('   3. Test payroll flows');
    console.log('   4. Test cash-out flows');

    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Onboarding failed:', error);
    await db.pool.end();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  onboardUsers();
}

module.exports = { onboardUsers, createEmployers, createWorkers };

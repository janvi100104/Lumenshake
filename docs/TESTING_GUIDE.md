# 🧪 LumenShake - Complete Testing Guide

This guide covers how to test every component of the LumenShake project.

---

## 📋 **Table of Contents**

1. [Smart Contract Testing](#1-smart-contract-testing)
2. [Backend API Testing](#2-backend-api-testing)
3. [Frontend Testing](#3-frontend-testing)
4. [End-to-End Workflow Testing](#4-end-to-end-workflow-testing)
5. [Integration Testing](#5-integration-testing)
6. [Security Testing](#6-security-testing)

---

## 1. Smart Contract Testing

### ✅ **Unit Tests (Rust)**

The Soroban smart contract has 14 comprehensive unit tests covering all core functions.

```bash
cd contracts/payroll_contract
cargo test
```

**Expected Output:**
```
running 14 tests
test test::test_initialize_contract ... ok
test test::test_register_employer ... ok
test test::test_add_employee ... ok
test test::test_run_payroll ... ok
test test::test_claim_payroll ... ok
test test::test_pause_contract ... ok
test test::test_full_payroll_flow ... ok
test test::test_initialize_contract_only_once - should panic ... ok
test test::test_register_duplicate_employer - should panic ... ok
test test::test_pause_unauthorized - should panic ... ok
test test::test_add_employee_invalid_amount - should panic ... ok
test test::test_run_payroll_duplicate_period - should panic ... ok
test test::test_add_duplicate_employee - should panic ... ok
test test::test_claim_payroll_only_once - should panic ... ok

test result: ok. 14 passed; 0 failed
```

### 📦 **Build Contract to WASM**

```bash
cd contracts/payroll_contract
cargo build --target wasm32-unknown-unknown --release
```

**Verify WASM file exists:**
```bash
ls -lh target/wasm32-unknown-unknown/release/payroll_contract.wasm
```

### 🚀 **Deploy to Futurenet/Testnet**

**Prerequisites:**
- Soroban CLI installed (`soroban --version`)
- Stellar account funded with test XLM

```bash
# 1. Generate identity
soroban config identity generate employer

# 2. Get your address
soroban config identity address employer

# 3. Fund account (replace YOUR_ADDRESS)
curl "https://friendbot.stellar.org?addr=YOUR_ADDRESS"

# 4. Deploy contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payroll_contract.wasm \
  --source employer \
  --rpc-url https://soroban-testnet.stellar.org \
  --network testnet

# Save the CONTRACT_ID returned!

# 5. Initialize contract
soroban contract invoke \
  --id CONTRACT_ID \
  --source employer \
  --rpc-url https://soroban-testnet.stellar.org \
  --network testnet \
  -- \
  initialize \
  --admin YOUR_ADDRESS \
  --usdc_token USDC_TOKEN_ADDRESS
```

### 🔍 **Test Contract Functions via CLI**

```bash
# Register employer
soroban contract invoke \
  --id CONTRACT_ID \
  --source employer \
  --rpc-url https://soroban-testnet.stellar.org \
  --network testnet \
  -- \
  register_employer \
  --employer YOUR_ADDRESS \
  --kyc_hash 0000000000000000000000000000000000000000000000000000000000000000

# Add employee
soroban contract invoke \
  --id CONTRACT_ID \
  --source employer \
  --rpc-url https://soroban-testnet.stellar.org \
  --network testnet \
  -- \
  add_employee \
  --employer YOUR_ADDRESS \
  --employee EMPLOYEE_ADDRESS \
  --amount 1000 \
  --currency USDC

# Run payroll
soroban contract invoke \
  --id CONTRACT_ID \
  --source employer \
  --rpc-url https://soroban-testnet.stellar.org \
  --network testnet \
  -- \
  run_payroll \
  --employer YOUR_ADDRESS \
  --period 1

# Claim payroll (as employee)
soroban contract invoke \
  --id CONTRACT_ID \
  --source employee \
  --rpc-url https://soroban-testnet.stellar.org \
  --network testnet \
  -- \
  claim_payroll \
  --employee EMPLOYEE_ADDRESS \
  --employer EMPLOYER_ADDRESS \
  --period 1

# Check escrow balance
soroban contract invoke \
  --id CONTRACT_ID \
  --source employer \
  --rpc-url https://soroban-testnet.stellar.org \
  --network testnet \
  -- \
  get_escrow_balance

# View contract events
soroban contract events \
  --id CONTRACT_ID \
  --rpc-url https://soroban-testnet.stellar.org \
  --network testnet
```

---

## 2. Backend API Testing

### 🚀 **Start Backend Server**

```bash
cd backend
npm install
node src/index.js
```

**Expected Output:**
```
✓ Database connection verified
🚀 LumenShake Backend running on port 4000
📝 Environment: development
🌐 API: http://localhost:4000/api
🏥 Health: http://localhost:4000/health
```

### 🏥 **Test Health Endpoint**

```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-25T07:55:23.855Z",
  "uptime": 28.93
}
```

### 🔐 **Test SEP-10 Authentication**

**Step 1: Generate Challenge**
```bash
curl "http://localhost:4000/api/auth/challenge?account=YOUR_STELLAR_ADDRESS"
```

**Expected Response:**
```json
{
  "transaction": "AAAAA...",
  "network_passphrase": "Test SDF Network ; September 2015"
}
```

**Step 2: Sign Transaction (in wallet) and Verify**
```bash
curl -X POST http://localhost:4000/api/auth/auth \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "SIGNED_TRANSACTION_XDR"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "account": "YOUR_STELLAR_ADDRESS",
  "expires_in": "24h",
  "token_type": "Bearer"
}
```

### 👤 **Test SEP-12 KYC (Customer Information)**

**Register Customer:**
```bash
curl -X PUT http://localhost:4000/api/customer/customer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "individual",
    "first_name": "John",
    "last_name": "Doe",
    "email_address": "john@example.com",
    "phone_number": "+1234567890"
  }'
```

**Get Customer:**
```bash
curl http://localhost:4000/api/customer/customer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update KYC Status (Admin):**
```bash
curl -X POST http://localhost:4000/api/customer/customer/kyc \
  -H "Content-Type: application/json" \
  -d '{
    "account": "YOUR_STELLAR_ADDRESS",
    "kyc_status": "approved",
    "kyc_level": "full"
  }'
```

### 💰 **Test Payroll API**

**Register Employer:**
```bash
curl -X POST http://localhost:4000/api/payroll/employers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "stellar_address": "YOUR_ADDRESS",
    "kyc_hash": "0000...",
    "tx_hash": "TRANSACTION_HASH"
  }'
```

**Add Employee:**
```bash
curl -X POST http://localhost:4000/api/payroll/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employer_address": "EMPLOYER_ADDRESS",
    "employee_address": "EMPLOYEE_ADDRESS",
    "salary": 1000,
    "currency": "USDC",
    "tx_hash": "TRANSACTION_HASH"
  }'
```

**Run Payroll:**
```bash
curl -X POST http://localhost:4000/api/payroll/payroll/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employer_address": "EMPLOYER_ADDRESS",
    "period": 1,
    "total_amount": 1000,
    "tx_hash": "TRANSACTION_HASH"
  }'
```

**Claim Payroll:**
```bash
curl -X POST http://localhost:4000/api/payroll/payroll/claim \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employee_address": "EMPLOYEE_ADDRESS",
    "employer_address": "EMPLOYER_ADDRESS",
    "period": 1,
    "amount": 1000,
    "tx_hash": "TRANSACTION_HASH"
  }'
```

### 🏦 **Test SEP-24 (Interactive Payments)**

**Create Deposit:**
```bash
curl -X POST http://localhost:4000/api/sep24/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "asset_code": "USDC",
    "asset_issuer": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    "amount": "1000.00",
    "external_account": "BANK123456"
  }'
```

**Create Withdrawal:**
```bash
curl -X POST http://localhost:4000/api/sep24/withdraw \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "asset_code": "USDC",
    "asset_issuer": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    "amount": "500.00",
    "external_account": "MOBILE123"
  }'
```

**Get Transaction:**
```bash
curl http://localhost:4000/api/sep24/transaction/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 🌍 **Test SEP-31 (Cross-Border Sends)**

**Create Send Transaction:**
```bash
curl -X POST http://localhost:4000/api/sep31/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": "1500.00",
    "sell_asset": "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    "buy_asset": "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    "receiver_account": "GBReceiver123",
    "receiver_name": "Maria Garcia",
    "receiver_country": "MX",
    "receiver_external_account": "CLABE1234567890"
  }'
```

### 💵 **Test MoneyGram Integration**

**Get Exchange Rates:**
```bash
curl http://localhost:4000/api/moneygram/rates?currency=MXN
```

**Find Pickup Locations:**
```bash
curl "http://localhost:4000/api/moneygram/locations?country=MX&city=Mexico+City"
```

**Initiate Cash-Out:**
```bash
curl -X POST http://localhost:4000/api/moneygram/cashout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 500,
    "currency": "MXN",
    "receiver_name": "Maria Garcia",
    "location_id": "LOC123"
  }'
```

### 🔔 **Test Webhooks**

**Subscribe to Webhooks:**
```bash
curl -X POST http://localhost:4000/api/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhook",
    "event_types": ["transaction.status_changed", "sep31.transaction.status_changed"]
  }'
```

**Get Subscriptions:**
```bash
curl http://localhost:4000/api/webhooks
```

### 📊 **Run Automated Test Scripts**

```bash
# Test SEP-24/31 & Webhooks
cd backend
node test-phase5.js

# Test MoneyGram Integration
node test-phase6.js
```

---

## 3. Frontend Testing

### 🚀 **Start Development Server**

```bash
cd web
npm install
npm run dev
```

**Open Browser:** http://localhost:3000

### 📱 **Test UI Components**

#### **Wallet Connection**
1. Click "Connect Freighter Wallet"
2. Approve connection in Freighter extension
3. Verify wallet address displays correctly

**Without Freighter installed:**
- App uses demo mode with test address
- Check browser console (F12) for connection logs

#### **Employer Dashboard**

**Test Employer Registration:**
1. Connect wallet
2. Enter KYC hash (or leave blank for zero hash)
3. Click "Register Employer"
4. Verify success message with transaction hash

**Test Add Employee:**
1. Enter employee Stellar address (G...)
2. Enter salary amount (e.g., 1000)
3. Click "Add Employee"
4. Verify success message

**Test Run Payroll:**
1. Enter payroll period number (e.g., 1)
2. Click "Run Payroll"
3. Verify success message

#### **Worker Dashboard**

**Test Claim Payroll:**
1. Connect employee wallet
2. View available payroll periods
3. Click "Claim Payroll" for a period
4. Verify USDC transfer confirmation

#### **Cash-Out Dashboard**

**Test MoneyGram Integration:**
1. Select destination currency
2. View exchange rates
3. Find nearby pickup locations
4. Initiate cash-out
5. Verify PIN generation

### 🔍 **Browser DevTools Testing**

**Open Console (F12):**
- Check for errors
- View transaction logs
- Monitor API calls

**Network Tab:**
- Verify API requests to backend
- Check response status codes
- Monitor WebSocket connections (if any)

**Application Tab:**
- Check localStorage for wallet data
- Verify environment variables

---

## 4. End-to-End Workflow Testing

### 🎯 **Complete Payroll Flow Test**

**Scenario:** Employer pays employee, employee claims and cashes out

#### **Step 1: Setup**
```bash
# 1. Start backend
cd backend && node src/index.js

# 2. Start frontend
cd web && npm run dev

# 3. Ensure contract is deployed
# Save CONTRACT_ID
```

#### **Step 2: Employer Registration**
1. Open http://localhost:3000
2. Connect Freighter wallet (employer account)
3. Register employer with KYC hash
4. Verify on blockchain explorer

#### **Step 3: Add Employee**
1. Enter employee Stellar address
2. Set salary (e.g., 1000 USDC)
3. Submit and verify transaction

#### **Step 4: Fund Escrow**
```bash
soroban contract invoke \
  --id CONTRACT_ID \
  --source employer \
  --rpc-url https://soroban-testnet.stellar.org \
  --network testnet \
  -- \
  deposit_escrow \
  --employer EMPLOYER_ADDRESS \
  --amount 1000
```

#### **Step 5: Run Payroll**
1. Enter period number (1)
2. Execute payroll
3. Verify payroll period created

#### **Step 6: Employee Claims**
1. Switch to employee wallet in Freighter
2. Navigate to worker dashboard
3. Claim payroll for period 1
4. Verify USDC received in wallet

#### **Step 7: Cash-Out at MoneyGram**
1. Select cash-out option
2. Choose currency (e.g., MXN)
3. Find pickup location
4. Generate PIN
5. Employee visits MoneyGram with PIN

---

## 5. Integration Testing

### 🔗 **Test Contract ↔ Backend Integration**

**Verify backend mirrors contract state:**

```bash
# 1. Check contract state
soroban contract invoke \
  --id CONTRACT_ID \
  --source employer \
  --rpc-url https://soroban-testnet.stellar.org \
  --network testnet \
  -- \
  get_employer \
  --employer YOUR_ADDRESS

# 2. Check backend state
curl http://localhost:4000/api/payroll/employers/YOUR_ADDRESS
```

**Both should return matching data!**

### 🔄 **Test SEP-10 → SEP-12 → Payroll Flow**

```bash
# 1. Authenticate (SEP-10)
CHALLENGE=$(curl "http://localhost:4000/api/auth/challenge?account=YOUR_ADDRESS")
# Sign transaction in wallet
TOKEN=$(curl -X POST http://localhost:4000/api/auth/auth \
  -H "Content-Type: application/json" \
  -d '{"transaction": "SIGNED_XDR"}')

# 2. Register customer (SEP-12)
curl -X PUT http://localhost:4000/api/customer/customer \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"first_name": "John", "last_name": "Doe"}'

# 3. Approve KYC
curl -X POST http://localhost:4000/api/customer/customer/kyc \
  -d '{"account": "YOUR_ADDRESS", "kyc_status": "approved"}'

# 4. Register employer (now KYC-gated)
curl -X POST http://localhost:4000/api/payroll/employers \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"stellar_address": "YOUR_ADDRESS", "tx_hash": "TX123"}'
```

---

## 6. Security Testing

### 🔒 **Test Rate Limiting**

```bash
# Send 100 requests in rapid succession
for i in {1..100}; do
  curl -s http://localhost:4000/api/auth/challenge?account=TEST &
done

# Verify rate limiter kicks in (429 status)
```

### 🛡️ **Test Input Validation**

**Invalid Stellar Address:**
```bash
curl -X POST http://localhost:4000/api/payroll/employers \
  -H "Content-Type: application/json" \
  -d '{
    "stellar_address": "INVALID",
    "tx_hash": "TX123"
  }'
# Should return 400 error
```

**Negative Salary:**
```bash
curl -X POST http://localhost:4000/api/payroll/employees \
  -H "Content-Type: application/json" \
  -d '{
    "employer_address": "EMPLOYER",
    "employee_address": "EMPLOYEE",
    "salary": -100,
    "tx_hash": "TX123"
  }'
# Should return 400 error
```

### 🔐 **Test Authentication**

**Access Protected Route Without Token:**
```bash
curl http://localhost:4000/api/payroll/employers/YOUR_ADDRESS
# Should return 401 Unauthorized
```

**Use Expired Token:**
```bash
curl http://localhost:4000/api/customer/customer \
  -H "Authorization: Bearer EXPIRED_TOKEN"
# Should return 401 Unauthorized
```

### 🚨 **Test Replay Attack Prevention**

**Use Same SEP-10 Challenge Twice:**
```bash
# First verification (succeeds)
curl -X POST http://localhost:4000/api/auth/auth \
  -d '{"transaction": "SIGNED_XDR"}'

# Second verification with same transaction (should fail)
curl -X POST http://localhost:4000/api/auth/auth \
  -d '{"transaction": "SIGNED_XDR"}'
# Should return error: "Nonce has already been used"
```

### 📝 **Test Audit Logging**

**Check logs directory:**
```bash
cat backend/logs/app.log
cat backend/logs/error.log
```

**Verify all actions are logged:**
- Authentication attempts
- Payroll operations
- KYC updates
- Errors

---

## 🎯 **Testing Checklist**

### ✅ Smart Contract
- [ ] All 14 unit tests pass
- [ ] Contract compiles to WASM
- [ ] Deploy to testnet successfully
- [ ] Initialize contract
- [ ] Test all 8 functions via CLI
- [ ] Verify events are emitted
- [ ] Check storage state

### ✅ Backend API
- [ ] Health endpoint responds
- [ ] SEP-10 auth flow works
- [ ] SEP-12 KYC CRUD operations
- [ ] Payroll endpoints (CRUD)
- [ ] SEP-24 deposit/withdrawal
- [ ] SEP-31 cross-border sends
- [ ] MoneyGram integration
- [ ] Webhook subscriptions
- [ ] Rate limiting active
- [ ] Input validation works
- [ ] Audit logs created

### ✅ Frontend
- [ ] Wallet connection works
- [ ] Employer registration UI
- [ ] Add employee form
- [ ] Run payroll interface
- [ ] Worker claim UI
- [ ] Cash-out dashboard
- [ ] Error messages display
- [ ] Loading states work
- [ ] Transaction hashes shown

### ✅ End-to-End
- [ ] Full payroll flow works
- [ ] Contract ↔ Backend sync
- [ ] SEP-10 → SEP-12 → Payroll
- [ ] Employee receives USDC
- [ ] MoneyGram cash-out

### ✅ Security
- [ ] Rate limiting prevents abuse
- [ ] Input validation rejects bad data
- [ ] Authentication required for protected routes
- [ ] Replay attacks prevented
- [ ] Audit trail complete

---

## 🐛 **Common Issues & Solutions**

### Contract Deployment Fails
```bash
# Check account balance
soroban config identity address employer
curl "https://friendbot.stellar.org?addr=YOUR_ADDRESS"

# Clean and rebuild
cd contracts/payroll_contract
cargo clean
cargo build --target wasm32-unknown-unknown --release
```

### Backend Database Errors
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Run migrations
cd backend
node src/database/migrate.js
```

### Frontend Not Connecting to Contract
```bash
# Check .env.local
cat web/.env.local

# Should have:
# NEXT_PUBLIC_CONTRACT_ID=YOUR_CONTRACT_ID
# NEXT_PUBLIC_NETWORK=testnet
# NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
```

### Wallet Not Connecting
1. Install Freighter extension
2. Switch to Testnet/Futurenet
3. Import account with test XLM
4. Authorize connection in extension

---

## 📚 **Additional Resources**

- **Stellar Explorer:** https://stellar.expert/explorer/testnet
- **Soroban Docs:** https://developers.stellar.org/docs/build/smart-contracts
- **SEP-10 Spec:** https://developers.stellar.org/docs/standards/stellar-ecosystem-premium-seps/sep-0010
- **SEP-12 Spec:** https://developers.stellar.org/docs/standards/stellar-ecosystem-premium-seps/sep-0012
- **Freighter Wallet:** https://www.freighter.app/

---

**Happy Testing! 🎉**

# 🚀 TokenPay Deployment Guide

## Current Status

### ✅ Completed:
- Smart contract written (Rust/Soroban)
- Contract compiled to WASM (16KB)
- Web dashboard UI built
- Deployment script created

### 🔄 In Progress:
- Soroban CLI installation (`cargo install soroban-cli`)
- This takes 5-10 minutes to compile

### ⏳ Next Steps:
1. Wait for Soroban CLI to finish installing
2. Run deployment script
3. Connect UI to blockchain

---

## 📋 Deployment Steps

### Step 1: Check if Soroban CLI is Ready

```bash
soroban --version
```

If you see a version number, it's ready! If not, wait for the cargo install to complete.

**Check installation progress:**
```bash
ps aux | grep "cargo install"
```

### Step 2: Deploy the Contract

Once Soroban CLI is installed, run:

```bash
./scripts/deploy.sh
```

This script will:
1. ✅ Check Soroban CLI is installed
2. ✅ Verify WASM contract exists
3. ✅ Create admin identity
4. ✅ Fund account with test XLM (via Friendbot)
5. ✅ Deploy contract to Futurenet
6. ✅ Initialize contract
7. ✅ Configure web app with contract ID

### Step 3: Start the Web App

```bash
cd web
npm run dev
```

Visit: http://localhost:3000

### Step 4: Test the Full Flow

1. **Connect Wallet** (or use demo mode)
2. **Register as Employer** → Data goes to blockchain
3. **Add Employee** → Stored on Stellar
4. **Run Payroll** → Creates payroll period on-chain
5. **Employee Claims** → Withdraws from contract

---

## 🔍 What Happens When You Use the App

### Before (Current State):
```
User fills form → console.log() → Data goes nowhere ❌
```

### After Deployment:
```
User fills form → Smart Contract → Stellar Blockchain → Permanent record ✅
```

### Example Transaction:

**Employer adds employee:**
```typescript
// What happens behind the scenes:
await contract.addEmployee({
  employer: "GEMPLOYER123...",
  employee: "GEMPLOYEE456...",
  amount: 1000,
  currency: "USDC"
});

// This creates a transaction on Stellar:
// 1. Transaction is signed by employer wallet
// 2. Sent to Stellar network
// 3. Contract executes and stores data
// 4. Transaction is confirmed (~5 seconds)
// 5. Data is permanent on blockchain
```

**Where the data goes:**
- Stored in the smart contract's storage on Stellar
- Visible on Stellar Expert: https://stellar.expert/
- Can be queried by anyone
- Cannot be modified (immutable)
- Persists forever

---

## 🎯 Contract Functions (What the Forms Do)

### 1. `register_employer`
**Form**: Employer registration
**What it does**: Stores employer address + KYC hash on blockchain
**Storage**: `employers[address] = {kyc_hash, is_paused}`

### 2. `add_employee`
**Form**: Add Employee
**What it does**: Links employee to employer with salary
**Storage**: `employees[(employer, employee)] = {salary, currency}`

### 3. `run_payroll`
**Form**: Run Payroll
**What it does**: Creates a new payroll period
**Storage**: `payroll_periods[(employer, period)] = {total_amount}`

### 4. `claim_payroll`
**Form**: (Future employee dashboard)
**What it does**: Employee withdraws their salary
**Storage**: Marks `payroll_claims[(employee, employer, period)] = true`

### 5. `pause_contract`
**Form**: (Admin only)
**What it does**: Emergency stop for compliance
**Storage**: Updates `employer.is_paused`

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│  Web Dashboard  │
│  (Next.js)      │
└────────┬────────┘
         │
         │ User submits form
         ▼
┌─────────────────┐
│  Freighter      │
│  Wallet         │
│  (Signs TX)     │
└────────┬────────┘
         │
         │ Signed transaction
         ▼
┌─────────────────┐
│  Stellar        │
│  Network        │
│  (Validates)    │
└────────┬────────┘
         │
         │ Execute contract
         ▼
┌─────────────────┐
│  Soroban Smart  │
│  Contract       │
│  (Stores data)  │
└────────┬────────┘
         │
         │ Data stored permanently
         ▼
┌─────────────────┐
│  Stellar        │
│  Blockchain     │
│  (Immutable)    │
└─────────────────┘
```

---

## 🛠️ Manual Deployment (If Script Fails)

### 1. Create Identity
```bash
soroban config identity generate tokenpay_admin
```

### 2. Get Address
```bash
soroban config identity address tokenpay_admin
```

### 3. Fund Account
```bash
# Replace with your address
curl "https://friendbot.stellar.org?addr=YOUR_ADDRESS"
```

### 4. Deploy Contract
```bash
soroban contract deploy \
  --wasm contracts/payroll_contract/target/wasm32-unknown-unknown/release/payroll_contract.wasm \
  --source tokenpay_admin \
  --rpc-url https://rpc-futurenet.stellar.org \
  --network futurenet
```

### 5. Initialize
```bash
soroban contract invoke \
  --id CONTRACT_ID \
  --source tokenpay_admin \
  --rpc-url https://rpc-futurenet.stellar.org \
  --network futurenet \
  -- \
  initialize \
  --admin YOUR_ADDRESS
```

### 6. Update Web App
```bash
# In web/.env.local
NEXT_PUBLIC_CONTRACT_ID=CONTRACT_ID_FROM_STEP_4
```

---

## 🔍 Verify Deployment

### Check Contract on Explorer:
```
https://stellar.expert/explorer/futurenet/contract/YOUR_CONTRACT_ID
```

### Test Contract Function:
```bash
soroban contract invoke \
  --id CONTRACT_ID \
  --source tokenpay_admin \
  --rpc-url https://rpc-futurenet.stellar.org \
  --network futurenet \
  -- \
  get_employer \
  --employer YOUR_ADDRESS
```

---

## 💡 Understanding the Blockchain Integration

### What's Different from Traditional Apps?

**Traditional App (Database):**
```
User → API → Server → PostgreSQL → Data stored
                          ↓
                    Can be modified
                    Can be deleted
                    Controlled by server
```

**Blockchain App (Smart Contract):**
```
User → Wallet → Stellar Network → Smart Contract → Data stored
                                        ↓
                                  Cannot be modified
                                  Cannot be deleted
                                  Decentralized
                                  Transparent to all
```

### Why This Matters for TokenPay:

1. **Trust**: Employers can't deny payroll was run
2. **Transparency**: All transactions are public
3. **Immutability**: Records can't be tampered with
4. **Cross-border**: Works globally without banks
5. **Automation**: Smart contract enforces rules

---

## 🚨 Troubleshooting

### Soroban CLI Not Installing
```bash
# Check if dependencies are installed
dpkg -l libssl-dev
which pkg-config

# If missing, install:
sudo apt-get install -y libssl-dev pkg-config
```

### Contract Deployment Fails
```bash
# Check account balance
soroban config identity address tokenpay_admin
# Visit: https://stellar.expert/explorer/futurenet/account/YOUR_ADDRESS

# Fund again if needed
curl "https://friendbot.stellar.org?addr=YOUR_ADDRESS"
```

### Web App Not Connecting
```bash
# Check .env.local
cat web/.env.local

# Should have:
# NEXT_PUBLIC_CONTRACT_ID=<contract_id>
```

---

## 📝 After Deployment

Once deployed, we need to:

1. ✅ **Update contract.ts** - Implement actual blockchain calls
2. ✅ **Add transaction feedback** - Show confirmation status
3. ✅ **Add error handling** - Handle failed transactions
4. ✅ **Add employee dashboard** - For claiming payroll
5. ✅ **Add transaction history** - View past payroll runs

---

**Next Action**: Wait for Soroban CLI to finish installing, then run `./scripts/deploy.sh`

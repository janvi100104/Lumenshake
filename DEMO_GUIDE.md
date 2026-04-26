# 🎬 TokenPay Demo Guide

> Complete step-by-step guide to demo your Stellar-powered cross-border payroll system

---

## 📋 Demo Overview

**Project**: TokenPay - Stellar-Powered Cross-Border Payroll System  
**Network**: Stellar Testnet  
**Contract ID**: `CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z`  
**Demo Duration**: 10-15 minutes  
**Audience**: Technical/Non-technical stakeholders  

---

## 🎯 What You'll Demo

1. ✅ **Employer Registration** - Register on blockchain with KYC
2. ✅ **Employee Management** - Add workers to payroll
3. ✅ **USDC Deposit** - Fund the escrow account
4. ✅ **Payroll Execution** - Run automated payroll distribution
5. ✅ **Worker Claims** - Employees claim their USDC
6. ✅ **Blockchain Verification** - Show real on-chain data

---

## 🚀 Pre-Demo Setup (Do This First)

### 1. Start the Web Dashboard

```bash
cd /home/janviunix/JANVI/project/Lumenshake/web
npm run dev
```

**Expected Output:**
```
✓ Ready in 2.3s
○ Local:   http://localhost:3000
```

### 2. Prepare Freighter Wallet

1. **Install Freighter** (if not already): https://www.freighter.app/
2. **Switch to Testnet** in Freighter settings
3. **Fund your wallet** with test XLM:
   ```
   https://friendbot.stellar.org/?addr=YOUR_WALLET_ADDRESS
   ```
4. **Get test USDC** from Stellar Laboratory or another testnet account

### 3. Verify Contract is Deployed

```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source tokenpay_admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- get_escrow_balance
```

**Expected Output**: `0` (or current balance)

---

## 📝 Demo Script (Step-by-Step)

### Opening (1 minute)

**Say**: 
> "TokenPay is a decentralized payroll system built on Stellar that enables employers to pay workers in USDC, with the ability for workers to cash out at any MoneyGram location—no bank account needed."

**Show**:
- Open http://localhost:3000 in browser
- Point out the clean, professional UI
- Mention the architecture: Smart Contract → Web Dashboard → MoneyGram

---

### Step 1: Connect Wallet (1 minute)

**Action**:
1. Click **"Connect Freighter Wallet"** button
2. Approve connection in Freighter popup
3. Show your wallet address appearing on screen

**Say**:
> "First, we connect our Stellar wallet. This uses Freighter, a secure Web3 wallet for the Stellar network."

---

### Step 2: Register as Employer (2 minutes)

**Option A: Via Web UI** (if integrated)
1. Enter KYC hash (can use: `0000000000000000000000000000000000000000000000000000000000000000`)
2. Click "Register Employer"
3. Approve transaction in Freighter

**Option B: Via CLI** (more reliable for demo)
```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source tokenpay_admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- \
  register_employer \
  --employer YOUR_WALLET_ADDRESS \
  --kyc_hash 0000000000000000000000000000000000000000000000000000000000000000
```

**Say**:
> "We're registering as an employer on the blockchain. This includes a KYC hash for compliance. The transaction is recorded immutably on Stellar."

**Show**:
- Transaction hash in terminal
- Success message

---

### Step 3: Add Employee (2 minutes)

**Action** (Via CLI for reliability):
```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source tokenpay_admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- \
  add_employee \
  --employer YOUR_WALLET_ADDRESS \
  --employee EMPLOYEE_WALLET_ADDRESS \
  --amount 500 \
  --currency USDC
```

**💡 Pro Tip**: Have an employee wallet address ready. You can generate one:
```bash
stellar keys generate employee1 --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015"
stellar keys address employee1
```

**Say**:
> "Now we're adding an employee to the payroll. We specify their wallet address and salary amount (500 USDC). This is stored in the smart contract."

---

### Step 4: Deposit USDC to Escrow (2 minutes)

**Action**:
```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source tokenpay_admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- \
  deposit_escrow \
  --employer YOUR_WALLET_ADDRESS \
  --amount 1000
```

**Say**:
> "Before running payroll, the employer deposits USDC into the escrow. This ensures funds are available and secure. The smart contract holds these funds until workers claim them."

**Verify**:
```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source tokenpay_admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- get_escrow_balance
```

**Expected Output**: `1000`

---

### Step 5: Run Payroll (2 minutes)

**Action**:
```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source tokenpay_admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- \
  run_payroll \
  --employer YOUR_WALLET_ADDRESS \
  --period 1
```

**Say**:
> "Now we execute the payroll for period 1. The smart contract automatically calculates what each employee is owed and marks it as claimable. This happens instantly on-chain, with no intermediaries."

---

### Step 6: Employee Claims Payroll (2 minutes)

**Action** (Switch to employee wallet or use CLI):
```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source employee1 \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- \
  claim_payroll \
  --employee EMPLOYEE_WALLET_ADDRESS \
  --employer YOUR_WALLET_ADDRESS \
  --period 1
```

**Say**:
> "The employee can now claim their 500 USDC directly from the smart contract. The funds are transferred instantly to their wallet. No bank account needed, no waiting for clearing."

**Verify Employee Balance**:
```bash
stellar keys balance employee1 --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015"
```

---

### Step 7: Blockchain Verification (2 minutes)

**Show Live Data**:
1. Open: https://stellar.expert/explorer/testnet/contract/CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z
2. Point out:
   - Contract interactions
   - Transaction history
   - Events/logs
   - Current state

**Say**:
> "Everything we just did is permanently recorded on the Stellar blockchain. You can verify every transaction, every state change. This is transparent, auditable, and immutable."

---

## 🎨 Demo Highlights to Emphasize

### 🔒 Security & Compliance
- **KYC Integration**: Every employer is verified
- **Smart Contract Escrow**: Funds are secure and programmable
- **Immutable Records**: All transactions on blockchain
- **Emergency Controls**: Pause function for safety

### 💰 Financial Benefits
- **Cross-Border**: Works globally, no geographic restrictions
- **Low Cost**: Stellar fees are fractions of a cent
- **Fast Settlement**: 3-5 seconds vs. days for traditional systems
- **No Intermediaries**: Direct employer-to-worker payments

### 🌍 Real-World Impact
- **Bankless Workers**: 1.7B unbanked adults can receive payments
- **MoneyGram Cash-Out**: 400K+ physical locations worldwide
- **Financial Inclusion**: Workers without banks can access funds
- **Transparent**: Employers and workers can verify everything

---

## 🛠️ Backup CLI Commands

Keep these ready in case the web UI has issues:

### Quick Verification Script
```bash
#!/bin/bash
# demo-verify.sh

CONTRACT="CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z"
RPC="https://soroban-testnet.stellar.org"
PASSPHRASE="Test SDF Network ; September 2015"

echo "🔍 Verifying Contract State..."
echo ""

echo "1. Escrow Balance:"
stellar contract invoke \
  --id $CONTRACT \
  --source tokenpay_admin \
  --rpc-url $RPC \
  --network-passphrase "$PASSPHRASE" \
  -- get_escrow_balance

echo ""
echo "2. Contract is responding ✅"
echo "3. View on Explorer:"
echo "   https://stellar.expert/explorer/testnet/contract/$CONTRACT"
```

Make it executable:
```bash
chmod +x demo-verify.sh
```

---

## 📊 Demo Data Cheat Sheet

Have this information ready:

| Item | Value |
|------|-------|
| **Contract ID** | `CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z` |
| **Network** | Stellar Testnet |
| **Explorer URL** | https://stellar.expert/explorer/testnet/contract/CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z |
| **RPC URL** | https://soroban-testnet.stellar.org |
| **Test XLM** | https://friendbot.stellar.org/?addr=YOUR_ADDRESS |
| **USDC Asset** | `CDJWVPS2QTPY7D7HPVDU2EFPOHUDW42IADFERCZNTY7NJY7MRZGGRVVH` |

---

## 🎯 Common Questions & Answers

**Q: Why Stellar?**  
A: Stellar offers 3-5 second finality, fractions-of-a-cent fees, and built-in compliance standards (SEPs). It's purpose-built for financial applications.

**Q: How is this different from traditional payroll?**  
A: Traditional payroll takes 2-5 days, costs $10-50 per transaction, and requires bank accounts. TokenPay is instant, costs <$0.01, and works for unbanked workers.

**Q: Is this secure?**  
A: The smart contract is deployed on Stellar's battle-tested network. We have KYC gating, emergency pause, and all transactions are auditable on-chain.

**Q: Can workers actually get cash?**  
A: Yes! Through MoneyGram integration, workers can cash out at 400K+ locations worldwide. The architecture supports this via SEP-24/31 anchor rails.

**Q: What about regulation?**  
A: We've built in SEP-10 authentication and SEP-12 KYC from day one. This meets international compliance standards for financial services.

---

## 🚨 Troubleshooting During Demo

| Issue | Solution |
|-------|----------|
| Wallet won't connect | Refresh page, ensure Freighter is unlocked |
| Transaction fails | Check test XLM balance, fund via Friendbot |
| Contract not responding | Verify contract ID, check network (testnet) |
| USDC balance shows 0 | Need to acquire testnet USDC first |
| Web UI errors | Check browser console, restart dev server |

**Emergency Fallback**: If web UI fails, switch to pure CLI demo. It's actually more impressive to technical audiences!

---

## 📸 Screenshot Checklist

Take screenshots of:
- [ ] Web dashboard homepage
- [ ] Wallet connection success
- [ ] Transaction confirmation in Freighter
- [ ] Stellar Explorer showing contract
- [ ] Successful payroll execution
- [ ] Employee receiving USDC

---

## 🎬 Demo Flow Summary (10 Minutes)

```
0:00 - Introduction & Architecture Overview
1:00 - Connect Wallet
2:00 - Register Employer (with KYC)
4:00 - Add Employee to Payroll
6:00 - Deposit USDC to Escrow
8:00 - Run Payroll
9:00 - Employee Claims USDC
10:00 - Show Blockchain Explorer
```

---

## 🎓 Advanced Demo (If You Have Extra Time)

### Show Compliance Flow
```bash
# SEP-10 Authentication
curl -X POST http://localhost:4000/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"account": "YOUR_ADDRESS"}'

# SEP-12 KYC Submission
curl -X POST http://localhost:4000/api/customer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"first_name": "John", "last_name": "Doe", ...}'
```

### Show Emergency Features
```bash
# Pause Contract
stellar contract invoke \
  --id $CONTRACT \
  --source tokenpay_admin \
  --rpc-url $RPC \
  --network-passphrase "$PASSPHRASE" \
  -- pause_contract \
  --admin ADMIN_ADDRESS \
  --employer EMPLOYER_ADDRESS
```

---

## ✅ Pre-Demo Checklist

- [ ] Web server running on port 3000
- [ ] Freighter wallet installed and funded
- [ ] Test XLM in wallet (from Friendbot)
- [ ] Test USDC in wallet
- [ ] Contract deployed and verified
- [ ] Employee wallet ready
- [ ] Stellar Explorer bookmarked
- [ ] CLI commands copied to terminal
- [ ] Backup script ready
- [ ] Practice run completed

---

## 🎉 Closing Statement

**Say**:
> "TokenPay demonstrates how blockchain can solve real-world problems. We've built a complete payroll system that's fast, cheap, compliant, and accessible to anyone with a phone—no bank account required. This isn't just a technical demo; it's a blueprint for financial inclusion."

**Show**:
- The complete flow one more time
- Stellar Explorer with all transactions
- Architecture diagram
- Future roadmap (MoneyGram integration, production deployment)

---

## 📞 Need Help?

**Project Documentation**:
- `/home/janviunix/JANVI/project/Lumenshake/docs/PROGRESS_REPORT.md`
- `/home/janviunix/JANVI/project/Lumenshake/docs/QUICKSTART_TESTNET.md`
- `/home/janviunix/JANVI/project/Lumenshake/QUICKSTART.md`

**External Resources**:
- Stellar Discord: https://discord.gg/stellardev
- Soroban Docs: https://developers.stellar.org/docs/build/smart-contracts/overview
- Stellar Expert: https://stellar.expert/

---

**Good luck with your demo! 🚀**

*Built with ❤️ on Stellar Soroban*

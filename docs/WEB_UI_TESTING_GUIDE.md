# 🚀 TokenPay UI Integration Guide

## ✅ What's Been Updated

Your web UI is now fully connected to the **Stellar Testnet** blockchain!

### Changes Made:

1. **Updated Network Configuration**
   - Changed from Futurenet to Testnet
   - Contract ID: `CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ`
   - RPC URL: `https://soroban-testnet.stellar.org`

2. **Added New Features**
   - ✅ Escrow balance display
   - ✅ Deposit to escrow functionality
   - ✅ Human-readable USDC amounts (7 decimal places)
   - ✅ Real-time blockchain data fetching
   - ✅ Transaction hash tracking
   - ✅ Stellar Explorer links

3. **Enhanced Dashboards**
   - Employer Dashboard: Register, deposit, add employees, run payroll
   - Worker Dashboard: Check status, claim payroll
   - All amounts now display in USDC (not stroops)

---

## 📋 Prerequisites

### 1. Install Freighter Wallet
- Browser extension: https://www.freighter.app/
- Create a wallet or import existing one
- **Switch to Testnet** in settings

### 2. Fund Your Testnet Account

You need test XLM for transaction fees:

```bash
# Get your wallet address from Freighter
# Then visit:
https://friendbot.stellar.org/?addr=YOUR_WALLET_ADDRESS

# Or use Stellar Laboratory:
https://laboratory.stellar.org/#create-account?network=test
```

### 3. Get Testnet USDC

For testing USDC transfers, you have two options:

**Option A: Use Stellar Laboratory**
1. Go to: https://laboratory.stellar.org/
2. Switch to Testnet
3. Use the "Issue Asset" tool to create test USDC
4. Send to your wallet

**Option B: Use Existing Testnet USDC**
- Testnet USDC Address: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- You can receive USDC from other testnet accounts

---

## 🎯 How to Test the Complete Flow

### Step 1: Start the Web App

```bash
cd /home/janviunix/JANVI/project/Lumenshake/web
npm run dev
```

Visit: **http://localhost:3000**

---

### Step 2: Connect Wallet

1. Click **"Connect Wallet"** button
2. Freighter will prompt for permission
3. Approve the connection
4. Your wallet address will appear

---

### Step 3: Register as Employer

1. Scroll to **"Employer Registration"** section
2. Enter a KYC hash (optional - can leave blank or enter any text)
   - Example: `my-kyc-reference-123`
3. Click **"Register Employer"**
4. Freighter will prompt to sign transaction
5. Approve the transaction
6. Wait ~5 seconds for confirmation
7. You'll see: "Employer is registered on-chain ✅"

**View on Stellar Explorer:**
```
https://stellar.expert/explorer/testnet/contract/CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ
```

---

### Step 4: Deposit USDC to Escrow

1. Scroll to **"Deposit to Escrow"** section
2. Enter amount (e.g., `1000` USDC)
3. Click **"Deposit to Escrow"**
4. Approve transaction in Freighter
5. Wait for confirmation
6. **Escrow Balance** will update to show `1000.00 USDC`

⚠️ **Important:** You must have USDC in your wallet for this to work!

---

### Step 5: Add Employee

1. Get a **second wallet address** (create another Freighter account or use a test address)
2. Scroll to **"Add Employee"** section
3. Enter employee's Stellar address (starts with `G...`)
4. Enter salary (e.g., `500` USDC)
5. Click **"Add Employee"**
6. Approve transaction
7. Employee is now registered on-chain

---

### Step 6: Run Payroll

1. Scroll to **"Run Payroll"** section
2. Enter payroll period (e.g., `1`)
3. Click **"Run Payroll"**
4. Approve transaction
5. Payroll period is created on-chain
6. Employee can now claim their funds

---

### Step 7: Switch to Worker Wallet

1. Disconnect current wallet
2. Connect the **employee's wallet** in Freighter
3. Navigate to **Worker Dashboard**

---

### Step 8: Check Payroll Status

1. Enter your **employer's address**
2. Enter payroll period: `1`
3. System will automatically fetch:
   - Employee salary
   - Payroll period status
   - Claim status

---

### Step 9: Claim Payroll

1. If payroll is ready, you'll see a **"Claim"** button
2. Click **"Claim 500.00 USDC"**
3. Approve transaction in Freighter
4. **USDC is transferred** from escrow to your wallet!
5. Transaction hash appears with link to Stellar Explorer

---

## 🔍 Verify on Blockchain

### View Contract State

```
https://stellar.expert/explorer/testnet/contract/CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ
```

You can see:
- All transactions
- Contract storage (employers, employees, payroll periods)
- Escrow balance
- Claim records

### View Transaction Details

After any transaction, click the **"View on Stellar Explorer"** link to see:
- Transaction hash
- Operations performed
- Events emitted
- Fees paid
- Confirmation status

---

## 🧪 Testing Checklist

Use this checklist to verify everything works:

- [ ] Freighter wallet connected to testnet
- [ ] Wallet funded with test XLM
- [ ] Wallet has test USDC
- [ ] Can connect wallet to app
- [ ] Can register as employer
- [ ] Can deposit USDC to escrow
- [ ] Escrow balance updates correctly
- [ ] Can add employee
- [ ] Can run payroll
- [ ] Employee can view payroll status
- [ ] Employee can claim payroll
- [ ] USDC transfers to employee wallet
- [ ] Can view transactions on Stellar Explorer
- [ ] Double-claim prevention works (try claiming again)

---

## 🐛 Troubleshooting

### "Account not found" Error

**Problem:** Your wallet doesn't exist on testnet

**Solution:**
```bash
# Fund your wallet with test XLM
https://friendbot.stellar.org/?addr=YOUR_WALLET_ADDRESS
```

### "Insufficient balance" Error

**Problem:** Not enough USDC in wallet for deposit

**Solution:**
- Get testnet USDC from another account
- Or use Stellar Laboratory to issue test tokens

### "Contract not found" Error

**Problem:** Wrong contract ID or network

**Solution:**
- Verify `.env.local` has correct contract ID
- Check Freighter is on Testnet (not Futurenet/Mainnet)

### Transaction Stuck "Pending"

**Problem:** Network congestion or low fee

**Solution:**
- Wait 10-15 seconds
- Check Stellar Explorer for status
- Retry if needed

### Freighter Not Connecting

**Problem:** Extension not detected

**Solution:**
- Refresh the page
- Check Freighter is unlocked
- Ensure Freighter is enabled for the site

---

## 📊 Understanding USDC Amounts

### Stroops vs USDC

Stellar uses **stroops** (smallest unit) internally:
- 1 USDC = 10,000,000 stroops (7 decimal places)
- Contract stores amounts in stroops
- UI converts to human-readable USDC

**Examples:**
- `10000000` stroops = `1.00` USDC
- `50000000` stroops = `5.00` USDC
- `1000000000` stroops = `100.00` USDC

---

## 🎓 What's Happening Behind the Scenes

### When You Register Employer:
```
1. You sign transaction with Freighter
2. Transaction sent to Stellar testnet
3. Contract executes: register_employer()
4. Data stored on-chain: {address, kyc_hash, is_paused}
5. Event emitted: "EmployerRegistered"
6. Transaction confirmed (~5 seconds)
7. UI updates to show "Registered ✅"
```

### When You Deposit to Escrow:
```
1. You approve USDC transfer
2. Contract executes: deposit_escrow()
3. USDC moves: Your Wallet → Contract Escrow
4. Escrow balance updated on-chain
5. Event emitted: "EscrowDeposited"
6. UI shows new balance
```

### When Employee Claims:
```
1. Employee signs claim transaction
2. Contract verifies: payroll exists, not claimed
3. Contract executes: claim_payroll()
4. USDC moves: Contract Escrow → Employee Wallet
5. Claim marked as completed
6. Event emitted: "PayrollClaimed"
7. Employee receives USDC in wallet
```

---

## 🚀 Next Steps

After testing on testnet:

1. **Add More Features**
   - Transaction history
   - Email notifications
   - Payroll scheduling
   - Multi-currency support

2. **Production Preparation**
   - Security audit
   - Deploy to Stellar Mainnet
   - Get MoneyGram API keys
   - Set up monitoring

3. **Demo Preparation**
   - Practice the flow 3-5 times
   - Prepare demo script
   - Record screen capture
   - Get test accounts ready

---

## 📚 Resources

- **Stellar Testnet Explorer**: https://stellar.expert/explorer/testnet
- **Your Contract**: https://stellar.expert/explorer/testnet/contract/CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ
- **Friendbot (Test XLM)**: https://friendbot.stellar.org/
- **Stellar Laboratory**: https://laboratory.stellar.org/
- **Freighter Wallet**: https://www.freighter.app/
- **Soroban Docs**: https://developers.stellar.org/docs/build/smart-contracts/overview

---

## 💡 Pro Tips

1. **Use Two Wallets** - One for employer, one for worker
2. **Start Small** - Test with 10-100 USDC first
3. **Check Explorer** - Verify every transaction on-chain
4. **Save Tx Hashes** - Keep record of all transactions
5. **Test Edge Cases** - Try double-claim, invalid amounts, etc.
6. **Monitor Gas** - Watch transaction fees on testnet

---

**🎉 You're now ready to test the complete payroll flow on Stellar testnet!**

If you encounter any issues, check the troubleshooting section or view the transaction details on Stellar Explorer to debug.

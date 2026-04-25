# 🚀 TokenPay - Quick Start Guide

Get TokenPay up and running in 10 minutes!

## Prerequisites Checklist

- [x] Rust installed (v1.93.1)
- [ ] Soroban CLI installed
- [ ] Node.js installed (v18+)
- [ ] Freighter wallet extension installed

---

## Step 1: Install Soroban CLI (2 minutes)

```bash
# Try this first
cargo install soroban-cli

# If that takes too long, use the pre-built binary
curl -sSf https://soroban.stellar.org/install.sh | sh

# Verify installation
soroban --version
```

---

## Step 2: Build the Smart Contract (1 minute)

```bash
cd contracts/payroll_contract

# Build WASM (already built if you see the file)
cargo build --target wasm32-unknown-unknown --release

# Run tests
cargo test

# Verify WASM exists
ls -lh target/wasm32-unknown-unknown/release/payroll_contract.wasm
```

**Expected output**: A 16KB WASM file

---

## Step 3: Setup Stellar Account (2 minutes)

```bash
# Generate identity
soroban config identity generate employer

# Get your address
soroban config identity address employer

# Fund via Friendbot (replace YOUR_ADDRESS)
curl "https://friendbot.stellar.org?addr=YOUR_ADDRESS"

# Verify funding
soroban config identity address employer
```

**Alternative**: Visit https://friendbot.stellar.org/?addr=YOUR_ADDRESS in browser

---

## Step 4: Deploy Contract (2 minutes)

### Option A: Use Deployment Script (Recommended)

```bash
# From project root
./deploy.sh
```

### Option B: Manual Deployment

```bash
# Deploy
soroban contract deploy \
  --wasm contracts/payroll_contract/target/wasm32-unknown-unknown/release/payroll_contract.wasm \
  --source employer \
  --rpc-url https://rpc-futurenet.stellar.org/ \
  --network futurenet

# Save the CONTRACT_ID returned!

# Initialize
soroban contract invoke \
  --id CONTRACT_ID \
  --source employer \
  --rpc-url https://rpc-futurenet.stellar.org/ \
  --network futurenet \
  -- \
  initialize \
  --admin YOUR_ADDRESS
```

---

## Step 5: Setup Web Dashboard (2 minutes)

```bash
cd web

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_CONTRACT_ID=YOUR_CONTRACT_ID" > .env.local
echo "NEXT_PUBLIC_NETWORK=futurenet" >> .env.local
echo "NEXT_PUBLIC_RPC_URL=https://rpc-futurenet.stellar.org/" >> .env.local

# Start development server
npm run dev
```

Visit: **http://localhost:3000**

---

## Step 6: Install Freighter Wallet (1 minute)

1. Go to https://www.freighter.app/
2. Install browser extension
3. Create new wallet or import existing
4. Switch network to **Futurenet**
5. Import the same account you funded in Step 3

---

## Testing the Full Flow

### As Employer:

1. **Connect Wallet**
   - Click "Connect Freighter Wallet"
   - Approve connection in extension

2. **Register as Employer** (needs UI update or CLI)
   ```bash
   soroban contract invoke \
     --id CONTRACT_ID \
     --source employer \
     --rpc-url https://rpc-futurenet.stellar.org/ \
     --network futurenet \
     -- \
     register_employer \
     --employer YOUR_ADDRESS \
     --kyc_hash 0000000000000000000000000000000000000000000000000000000000000000
   ```

3. **Add Employee**
   ```bash
   soroban contract invoke \
     --id CONTRACT_ID \
     --source employer \
     --rpc-url https://rpc-futurenet.stellar.org/ \
     --network futurenet \
     -- \
     add_employee \
     --employer YOUR_ADDRESS \
     --employee EMPLOYEE_ADDRESS \
     --amount 1000 \
     --currency USDC
   ```

4. **Run Payroll**
   ```bash
   soroban contract invoke \
     --id CONTRACT_ID \
     --source employer \
     --rpc-url https://rpc-futurenet.stellar.org/ \
     --network futurenet \
     -- \
     run_payroll \
     --employer YOUR_ADDRESS \
     --period 1
   ```

### As Employee:

5. **Claim Payroll**
   ```bash
   soroban contract invoke \
     --id CONTRACT_ID \
     --source employee \
     --rpc-url https://rpc-futurenet.stellar.org/ \
     --network futurenet \
     -- \
     claim_payroll \
     --employee EMPLOYEE_ADDRESS \
     --employer EMPLOYER_ADDRESS \
     --period 1
   ```

---

## Troubleshooting

### ❌ Soroban CLI not found
```bash
# Install via cargo
cargo install soroban-cli

# OR use binary
curl -sSf https://soroban.stellar.org/install.sh | sh

# Add to PATH if needed
export PATH="$HOME/.cargo/bin:$PATH"
```

### ❌ Account not funded
```bash
# Check if account exists
soroban config identity address employer

# Fund again
curl "https://friendbot.stellar.org?addr=YOUR_ADDRESS"
```

### ❌ Contract build fails
```bash
# Clean and rebuild
cd contracts/payroll_contract
cargo clean
cargo build --target wasm32-unknown-unknown --release
```

### ❌ Web app errors
```bash
cd web
rm -rf .next node_modules
npm install
npm run dev
```

### ❌ Wallet not connecting
1. Ensure Freighter is installed
2. Switch to Futurenet network
3. Authorize the connection
4. Check browser console for errors

---

## What's Next?

After testing the basics:

1. ✅ Add more employees
2. ✅ Run multiple payroll periods
3. ✅ Test emergency pause
4. ✅ Verify all edge cases
5. ⏳ Integrate SEP-31 for cross-border payments
6. ⏳ Connect MoneyGram API
7. ⏳ Add KYC verification

---

## Useful Commands

```bash
# Check contract storage
soroban contract read \
  --id CONTRACT_ID \
  --key employers \
  --rpc-url https://rpc-futurenet.stellar.org/ \
  --network futurenet

# View contract events
soroban contract events \
  --id CONTRACT_ID \
  --rpc-url https://rpc-futurenet.stellar.org/ \
  --network futurenet

# Re-run tests
cd contracts/payroll_contract
cargo test

# Rebuild contract
cargo build --target wasm32-unknown-unknown --release
```

---

## Need Help?

- **Documentation**: [README.md](README.md), [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Progress**: [PROGRESS.md](PROGRESS.md)
- **Roadmap**: [ROADMAP.md](ROADMAP.md)
- **Stellar Docs**: https://developers.stellar.org/docs/
- **Soroban SDK**: https://developers.stellar.org/docs/build/smart-contracts/overview

---

**Happy Building! 🎉**

# 🔐 SEP-10 Authentication & USDC Setup Guide

> Complete guide for getting test USDC and implementing SEP-10 authentication

---

## 📋 Table of Contents

1. [Getting Test USDC Balance](#part-1-getting-test-usdc-balance)
2. [Understanding SEP-10 Authentication](#part-2-understanding-sep-10-authentication)
3. [Complete SEP-10 Flow (Step-by-Step)](#part-3-complete-sep-10-flow-step-by-step)
4. [Using Authenticated Deposits](#part-4-using-authenticated-deposits)
5. [Quick Demo Commands](#part-5-quick-demo-commands)

---

## Part 1: Getting Test USDC Balance

You need USDC balance to deposit into the escrow. Here are 3 ways to get it:

### Method 1: Use Stellar Laboratory (Easiest) ⭐

1. **Open Stellar Laboratory**: https://laboratory.stellar.org/
2. **Switch to Testnet** (top-right corner)
3. Go to **"Account Creator"** tab
4. **Fund your account** if not already:
   ```
   https://friendbot.stellar.org/?addr=YOUR_ADDRESS
   ```

5. **Create Trustline for USDC**:
   - Go to "Build Transaction" → "Change Trust"
   - Asset: `USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
   - Sign with your wallet
   - Submit transaction

6. **Request USDC from community**:
   - Join Stellar Discord: https://discord.gg/stellardev
   - Ask in #dev-testnet channel for test USDC
   - Provide your address

### Method 2: Create Your Own Test USDC

```bash
# 1. Generate USDC issuer account
stellar keys generate usdc_issuer \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# 2. Get issuer address
ISSUER=$(stellar keys address usdc_issuer)
echo "Issuer: $ISSUER"

# 3. Fund issuer account
curl "https://friendbot.stellar.org?addr=$ISSUER"

# 4. Create trustline from your account to issuer
# Replace YOUR_ADDRESS with your actual address
stellar transaction build \
  --source YOUR_ADDRESS \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --change-trust-line "USDC:$ISSUER" \
  --fee 100 | \
stellar transaction sign \
  --source YOUR_ADDRESS \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" | \
stellar transaction submit \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# 5. Mint USDC to your account (from issuer)
stellar transaction build \
  --source usdc_issuer \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --payment "YOUR_ADDRESS/USDC:$ISSUER/10000" \
  --fee 100 | \
stellar transaction sign \
  --source usdc_issuer \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" | \
stellar transaction submit \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

**Result**: You now have 10,000 USDC!

### Method 3: Quick Check Your Balance

```bash
# Check XLM balance
stellar keys balance YOUR_KEY_NAME \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# View all assets on Stellar Expert
# https://stellar.expert/explorer/testnet/account/YOUR_ADDRESS
```

---

## Part 2: Understanding SEP-10 Authentication

### What is SEP-10?

SEP-10 is **Stellar Web Authentication** - it proves you own a Stellar account by signing a challenge with your private key.

### Why Do You Need It?

- ✅ **Required** for SEP-24 deposits/withdrawals
- ✅ **Required** for SEP-31 cross-border payments  
- ✅ **Required** for KYC submission (SEP-12)
- ✅ **Security** - no passwords, just cryptographic proof

### How It Works (Simple Version)

```
You: "I want to authenticate as GABC123..."
Server: "Here's a random challenge, sign it to prove you own GABC123"
You: *signs challenge with wallet*
Server: "Signature valid! Here's your JWT token"
You: *uses JWT for all future requests*
```

---

## Part 3: Complete SEP-10 Flow (Step-by-Step)

### Prerequisites

1. **Backend must be running**:
   ```bash
   cd /home/janviunix/JANVI/project/Lumenshake/backend
   
   # Start PostgreSQL (if not running)
   sudo systemctl start postgresql
   
   # Run migrations
   npm run migrate
   
   # Start server
   npm start
   ```

2. **Install jq** (for JSON parsing):
   ```bash
   sudo apt-get install jq
   ```

### Step 1: Get Authentication Challenge

```bash
# Replace with your Stellar address
YOUR_ADDRESS="YOUR_G_ADDRESS_HERE"

curl -X GET "http://localhost:4000/api/auth/challenge?account=$YOUR_ADDRESS" | jq .
```

**Response Example**:
```json
{
  "transaction": "AAAAAgAAAABkRz8LHqF...",
  "network_passphrase": "Test SDF Network ; September 2015"
}
```

**Save the `transaction` value** - you need to sign it!

### Step 2: Sign the Challenge

#### Option A: Using Freighter (In Browser)

Open browser console (F12) and run:

```javascript
// Import Freighter API
const { signTransaction } = await import('@stellar/freighter-api');

// Your challenge from Step 1
const challengeXdr = "AAAAAgAAAABkRz8LHqF..."; // Replace with actual XDR

// Sign it
const signedXdr = await signTransaction(challengeXdr, {
  address: "YOUR_ADDRESS",
  networkPassphrase: "Test SDF Network ; September 2015"
});

console.log("Signed XDR:", signedXdr);
// Copy this output!
```

#### Option B: Using Stellar CLI

```bash
# Sign the challenge
stellar transaction sign \
  --xdr "AAAAAgAAAABkRz8LHqF..." \
  --source YOUR_KEY_NAME \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

**Result**: You now have a **signed XDR** - save it!

### Step 3: Verify and Get JWT Token

```bash
# Replace with your signed XDR from Step 2
SIGNED_XDR="AAAAAgAAAABkRz8LHqF...SIGNED_VERSION..."

curl -X POST "http://localhost:4000/api/auth/auth" \
  -H "Content-Type: application/json" \
  -d "{\"transaction\": \"$SIGNED_XDR\"}" | jq .
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHQUJD...",
  "account": "GABC123...",
  "expires_in": "24h",
  "token_type": "Bearer"
}
```

**🎉 Success!** You're now authenticated!

**Save the `token` value** - you'll need it for all authenticated requests.

### Step 4: Use JWT Token

```bash
# Save your token
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Example: Create authenticated deposit
curl -X POST "http://localhost:4000/api/sep24/deposit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "asset_code": "USDC",
    "asset_issuer": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    "amount": "1000"
  }' | jq .
```

---

## Part 4: Using Authenticated Deposits

### Complete Deposit Flow with SEP-10

```bash
#!/bin/bash
# Full authenticated deposit flow

# Configuration
YOUR_ADDRESS="YOUR_G_ADDRESS"
BACKEND_URL="http://localhost:4000"

echo "🔐 Starting SEP-10 Authentication..."

# Step 1: Get challenge
echo "1. Getting challenge..."
CHALLENGE=$(curl -s "$BACKEND_URL/api/auth/challenge?account=$YOUR_ADDRESS" | jq -r '.transaction')
echo "✅ Challenge received"

# Step 2: Sign challenge (YOU DO THIS MANUALLY)
echo "2. Sign this challenge with your wallet:"
echo "$CHALLENGE"
echo ""
echo "Paste signed XDR:"
read SIGNED_XDR

# Step 3: Get JWT token
echo "3. Getting JWT token..."
JWT=$(curl -s -X POST "$BACKEND_URL/api/auth/auth" \
  -H "Content-Type: application/json" \
  -d "{\"transaction\": \"$SIGNED_XDR\"}" | jq -r '.token')

echo "✅ Authenticated! Token: ${JWT:0:30}..."

# Step 4: Create deposit
echo "4. Creating deposit transaction..."
DEPOSIT=$(curl -s -X POST "$BACKEND_URL/api/sep24/deposit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "asset_code": "USDC",
    "asset_issuer": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    "amount": "1000"
  }')

echo "✅ Deposit created:"
echo "$DEPOSIT" | jq .
```

### Automated Script

I've created a script that automates this entire flow:

```bash
# Make it executable
chmod +x sep10-auth-demo.sh

# Run it with your address
./sep10-auth-demo.sh YOUR_G_ADDRESS
```

---

## Part 5: Quick Demo Commands

### All-in-One Demo (Copy-Paste Ready)

```bash
# 1. Your address
export YOUR_ADDR="YOUR_G_ADDRESS_HERE"

# 2. Get challenge
CHALLENGE=$(curl -s "http://localhost:4000/api/auth/challenge?account=$YOUR_ADDR" | jq -r '.transaction')
echo "Challenge: $CHALLENGE"

# 3. Sign it with Freighter (do this in browser console)
# const { signTransaction } = await import('@stellar/freighter-api');
# const signed = await signTransaction("PASTE_CHALLENGE_HERE", {
#   address: "YOUR_ADDR",
#   networkPassphrase: "Test SDF Network ; September 2015"
# });
# console.log(signed);

# 4. Paste your signed XDR
export SIGNED_XDR="PASTE_SIGNED_XDR_HERE"

# 5. Get JWT token
export JWT=$(curl -s -X POST "http://localhost:4000/api/auth/auth" \
  -H "Content-Type: application/json" \
  -d "{\"transaction\": \"$SIGNED_XDR\"}" | jq -r '.token')

echo "✅ JWT Token: $JWT"

# 6. Create deposit (authenticated)
curl -X POST "http://localhost:4000/api/sep24/deposit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "asset_code": "USDC",
    "asset_issuer": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    "amount": "1000"
  }' | jq .

# 7. Create withdrawal (authenticated)
curl -X POST "http://localhost:4000/api/sep24/withdraw" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "asset_code": "USDC",
    "asset_issuer": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    "amount": "500"
  }' | jq .
```

---

## 🚨 Troubleshooting

### "Backend not running"
```bash
cd /home/janviunix/JANVI/project/Lumenshake/backend
npm start
```

### "Database connection error"
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb lumenshake 2>/dev/null || true

# Run migrations
cd /home/janviunix/JANVI/project/Lumenshake/backend
npm run migrate
```

### "Authentication failed - invalid signature"
- Make sure you're signing with the **correct account**
- Verify network passphrase matches: `Test SDF Network ; September 2015`
- Check that challenge hasn't expired (5 minutes)

### "USDC balance is 0"
- You need to acquire testnet USDC (see Part 1)
- Check balance: https://stellar.expert/explorer/testnet/account/YOUR_ADDRESS

---

## 📚 Important URLs

| Resource | URL |
|----------|-----|
| Backend API | http://localhost:4000 |
| Auth Challenge | http://localhost:4000/api/auth/challenge?account=YOUR_ADDR |
| Auth Verify | http://localhost:4000/api/auth/auth |
| Deposit Endpoint | http://localhost:4000/api/sep24/deposit |
| Withdrawal Endpoint | http://localhost:4000/api/sep24/withdraw |
| Stellar Expert | https://stellar.expert/explorer/testnet |
| Friendbot (Get XLM) | https://friendbot.stellar.org/?addr=YOUR_ADDR |
| Stellar Laboratory | https://laboratory.stellar.org/ |

---

## ✅ Demo Checklist

Before your demo, make sure:

- [ ] PostgreSQL is running
- [ ] Backend server is running on port 4000
- [ ] You have test XLM (from Friendbot)
- [ ] You have test USDC (from community or self-created)
- [ ] Freighter wallet is installed and unlocked
- [ ] Freighter is switched to Testnet
- [ ] You can get a JWT token via SEP-10
- [ ] You can create authenticated deposits
- [ ] You can create authenticated withdrawals

---

**Need help?** Check the automated script: `./sep10-auth-demo.sh YOUR_ADDRESS`

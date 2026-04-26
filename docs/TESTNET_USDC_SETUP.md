# Testnet USDC Setup Guide

## Current Status ✅

### Payroll Contract
- **Network**: Stellar Testnet
- **Contract ID**: `CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ`
- **Status**: ✅ Deployed and responding
- **Escrow Balance**: 0 USDC
- **Admin Key**: `lumenshake_admin_testnet`
- **Admin Address**: `GDT7ZKMWIS5BZLV3ONO27A4AX5GHJB4XB2M57QSZWPVUDDMKNZWW5QUJ`

### USDC Token Situation

The payroll contract expects a **Stellar Asset Contract (SAC)** for USDC transfers. On testnet, you have two options:

---

## Option 1: Use Test USDC (Recommended for Testing)

There is **no official USDC on Stellar testnet** (USDC is mainnet-only). For testing, you can:

### A. Deploy a Test Token SAC

```bash
# 1. Create a classic asset issuer account
stellar keys generate test_usdc_issuer
stellar keys fund test_usdc_issuer --network testnet

# 2. Get the issuer address
ISSUER_ADDR=$(stellar keys address test_usdc_issuer)
echo "Issuer: $ISSUER_ADDR"

# 3. Deploy the SAC for the test asset
stellar contract asset deploy \
  --asset "USDC:$ISSUER_ADDR" \
  --source-account lumenshake_admin_testnet \
  --network testnet

# This will output the SAC contract ID, e.g.:
# "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4"
```

### B. Initialize Payroll Contract with Test Token

```bash
# Replace SAC_CONTRACT_ID with the output from step 3
stellar contract invoke \
  --id CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ \
  --source-account lumenshake_admin_testnet \
  --network testnet \
  -- \
  initialize \
  --admin GDT7ZKMWIS5BZLV3ONO27A4AX5GHJB4XB2M57QSZWPVUDDMKNZWW5QUJ \
  --usdc_token SAC_CONTRACT_ID
```

### C. Mint Test USDC to Your Wallet

```bash
# You'll need to call the test token's mint function
# (SACs don't have mint - you'd need a custom token contract)
```

---

## Option 2: Use a Custom Test Token Contract

For full control, deploy a simple test token with minting capability:

### Deploy Test Token

```bash
# Clone the soroban-token-template or use a simple custom token
cd /tmp
git clone https://github.com/stellar/soroban-examples
cd soroban-examples/token

# Build the contract
cargo build --target wasm32v1-none --release

# Deploy to testnet
TOKEN_CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/token_contract.wasm \
  --source lumenshake_admin_testnet \
  --network testnet)

echo "Token Contract: $TOKEN_CONTRACT_ID"

# Initialize the token
stellar contract invoke \
  --id $TOKEN_CONTRACT_ID \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- \
  initialize \
  --admin GDT7ZKMWIS5BZLV3ONO27A4AX5GHJB4XB2M57QSZWPVUDDMKNZWW5QUJ \
  --decimal 7
```

### Update Payroll Contract

```bash
stellar contract invoke \
  --id CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- \
  initialize \
  --admin GDT7ZKMWIS5BZLV3ONO27A4AX5GHJB4XB2M57QSZWPVUDDMKNZWW5QUJ \
  --usdc_token $TOKEN_CONTRACT_ID
```

### Mint Test Tokens to Employer Wallet

```bash
# Mint 10,000 test USDC to employer wallet
stellar contract invoke \
  --id $TOKEN_CONTRACT_ID \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- \
  mint \
  --to EMPLOYER_WALLET_ADDRESS \
  --amount 100000000000  # 10,000 USDC (7 decimals)
```

---

## Option 3: Skip Token Transfers (Demo Mode)

For demonstration purposes without real token movement:

1. **Use the current setup** - The contract is deployed and functional
2. **Test read-only operations**:
   - ✅ Register employer
   - ✅ Add employee
   - ✅ Run payroll
   - ✅ Check escrow balance
   - ✅ Query payroll periods

3. **Token-dependent operations** will fail gracefully:
   - ❌ Deposit escrow (requires USDC approval)
   - ❌ Claim payroll (requires USDC in escrow)

---

## Quick Test Commands

### Verify Contract is Working

```bash
# Check escrow balance
stellar contract invoke \
  --id CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- get_escrow_balance

# Get USDC token address (currently set to admin address - needs update)
stellar contract invoke \
  --id CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- get_usdc_token
```

### Test Full Flow (After Token Setup)

```bash
# 1. Register employer
stellar contract invoke \
  --id CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- register_employer \
  --employer GDT7ZKMWIS5BZLV3ONO27A4AX5GHJB4XB2M57QSZWPVUDDMKNZWW5QUJ \
  --kyc_hash 0000000000000000000000000000000000000000000000000000000000000000

# 2. Deposit to escrow (requires USDC balance)
stellar contract invoke \
  --id CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- deposit_escrow \
  --employer GDT7ZKMWIS5BZLV3ONO27A4AX5GHJB4XB2M57QSZWPVUDDMKNZWW5QUJ \
  --amount 100000000  # 10 USDC

# 3. Check escrow balance
stellar contract invoke \
  --id CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- get_escrow_balance
```

---

## Web App Configuration

Update `.env.local` with the correct USDC token address after deployment:

```env
NEXT_PUBLIC_CONTRACT_ID=CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_USDC_TOKEN=<YOUR_DEPLOYED_TOKEN_CONTRACT_ID>
```

---

## Notes

- ✅ **Contract is deployed on testnet** and responding correctly
- ✅ **Admin account is funded** with testnet XLM
- ⚠️ **USDC token needs to be deployed** for full transfer functionality
- 📝 **For production**: Use official USDC on mainnet (`GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`)

---

## Next Steps

1. Deploy a test token contract (Option 2 recommended)
2. Initialize payroll contract with the token address
3. Mint test tokens to employer wallet
4. Test deposit → payroll → claim flow
5. Verify in web dashboard

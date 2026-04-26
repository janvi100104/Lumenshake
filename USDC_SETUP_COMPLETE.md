# ✅ USDC Token Setup Complete - Next Steps

## 🎉 What Was Accomplished

### 1. **Test USDC SAC Deployed** ✅
- **Token Contract ID**: `CATDCY6NNPYTNKFFURUDALNQRL7PVJSR6EPHGW62CZFDYAOI2SPMKPJM`
- **Issuer**: `GDT7ZKMWIS5BZLV3ONO27A4AX5GHJB4XB2M57QSZWPVUDDMKNZWW5QUJ`
- **Asset**: USDC (testnet)
- **Network**: Stellar Testnet

### 2. **New Payroll Contract Deployed** ✅
- **Contract ID**: `CDG4S5FXPKHITU3K2KXKY7WYV3FCRTMV7CTRQ5URFNA4I3VJXUZSQYIN`
- **USDC Token**: Correctly initialized with SAC token
- **Status**: Ready for testing

---

## ⚠️ Current Issue: SAC Trustline Requirement

The Stellar Asset Contract (SAC) requires users to **establish a trustline** before they can receive tokens. This is a Stellar protocol requirement for classic assets.

### **Why This Matters:**
- SAC wraps a classic Stellar asset (USDC:Issuer)
- Before receiving USDC, accounts must create a trustline to the issuer
- This adds friction for testing but matches real-world USDC behavior

---

## 🔧 Solution Options

### **Option 1: Use a Custom Token Contract (Recommended for Testing)**

Deploy a simple Soroban token contract (not SAC) that doesn't require trustlines. This is easier for testing.

**Steps:**
1. Deploy the test token contract from `/contracts/test_usdc/`
2. Update payroll contract to use it
3. Mint tokens directly (no trustlines needed)

**Pros:**
- ✅ No trustline setup required
- ✅ Instant token transfers
- ✅ Perfect for testing/demo

**Cons:**
- ❌ Not a real USDC SAC
- ❌ Different from production setup

---

### **Option 2: Establish Trustlines for Test Accounts**

Use the actual USDC SAC and create trustlines for test accounts.

**Steps for each test account:**
```bash
# 1. Create trustline from test_employer to USDC issuer
stellar token create --asset "USDC:GDT7ZKMW..." --account test_employer --network testnet

# 2. Now you can mint USDC to test_employer
stellar contract invoke --id CATDCY6NN... --mint --to <test_employer_address> --amount 1000000000
```

**Pros:**
- ✅ Uses real USDC SAC
- ✅ Matches production behavior

**Cons:**
- ❌ Requires trustline setup for every account
- ❌ More complex for testing

---

### **Option 3: Use Mainnet USDC (For Production)**

When deploying to mainnet, use the real USDC contract:
- **USDC Contract**: `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`

---

## 🚀 **Recommended: Deploy Custom Test Token**

Let's deploy a simple Soroban token that works immediately without trustlines:

### **Quick Commands:**

```bash
# 1. Build test token
cd /home/janviunix/JANVI/project/Lumenshake/contracts/test_usdc
cargo build --target wasm32v1-none --release

# 2. Deploy test token
cd /home/janviunix/JANVI/project/Lumenshake
stellar contract deploy \
  --wasm contracts/test_usdc/target/wasm32v1-none/release/test_usdc.wasm \
  --source lumenshake_admin_testnet \
  --network testnet \
  --alias test_token

# 3. Initialize test token (replace CONTRACT_ID with deployed ID)
stellar contract invoke \
  --id <DEPLOYED_TEST_TOKEN_ID> \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- initialize \
  --admin GDT7ZKMWIS5BZLV3ONO27A4AX5GHJB4XB2M57QSZWPVUDDMKNZWW5QUJ \
  --decimal 7

# 4. Deploy new payroll contract with test token
stellar contract deploy \
  --wasm contracts/payroll_contract/target/wasm32v1-none/release/payroll_contract.wasm \
  --source lumenshake_admin_testnet \
  --network testnet

# 5. Initialize payroll with test token
stellar contract invoke \
  --id <NEW_PAYROLL_CONTRACT_ID> \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- initialize \
  --admin GDT7ZKMWIS5BZLV3ONO27A4AX5GHJB4XB2M57QSZWPVUDDMKNZWW5QUJ \
  --usdc_token <DEPLOYED_TEST_TOKEN_ID>

# 6. Mint test tokens to employer
stellar contract invoke \
  --id <TEST_TOKEN_ID> \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- mint \
  --to <EMPLOYER_ADDRESS> \
  --amount 1000000000
```

---

## 📝 **Update Web App Configuration**

After deploying the test token, update these files:

### **1. web/.env.local**
```env
NEXT_PUBLIC_CONTRACT_ID=<NEW_PAYROLL_CONTRACT_ID>
NEXT_PUBLIC_USDC_TOKEN_ID=<TEST_TOKEN_ID>
```

### **2. web/utils/contract.ts**
Update the USDC token address if hardcoded anywhere.

---

## 🎯 **What You Can Test Right Now**

With the new payroll contract (`CDG4S5FXPKHITU3K2KXKY7WYV3FCRTMV7CTRQ5URFNA4I3VJXUZSQYIN`):

### **✅ Working (Read Operations):**
```bash
# Check escrow balance (should be 0)
stellar contract invoke \
  --id CDG4S5FXPKHITU3K2KXKY7WYV3FCRTMV7CTRQ5URFNA4I3VJXUZSQYIN \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- get_escrow_balance

# Get USDC token (should show SAC)
stellar contract invoke \
  --id CDG4S5FXPKHITU3K2KXKY7WYV3FCRTMV7CTRQ5URFNA4I3VJXUZSQYIN \
  --source lumenshake_admin_testnet \
  --network testnet \
  -- get_usdc_token
```

### **⏳ Needs USDC Balance (Write Operations):**
- `deposit_escrow` - Requires USDC in employer wallet
- `claim_payroll` - Requires USDC in escrow
- `run_payroll` - Requires payroll period with claims

---

## 💡 **Next Steps Recommendation**

1. **Deploy custom test token** (no trustlines needed) - 10 minutes
2. **Deploy new payroll contract** with test token - 5 minutes  
3. **Mint test USDC** to employer account - 2 minutes
4. **Update web app** environment variables - 2 minutes
5. **Test full flow**: Register → Add Employee → Deposit → Run Payroll → Claim - 10 minutes

**Total time**: ~30 minutes to full end-to-end testing

---

## 📞 **Quick Reference**

**Current Deployed Contracts:**
- USDC SAC: `CATDCY6NNPYTNKFFURUDALNQRL7PVJSR6EPHGW62CZFDYAOI2SPMKPJM`
- Payroll v2: `CDG4S5FXPKHITU3K2KXKY7WYV3FCRTMV7CTRQ5URFNA4I3VJXUZSQYIN`
- Admin Account: `GDT7ZKMWIS5BZLV3ONO27A4AX5GHJB4XB2M57QSZWPVUDDMKNZWW5QUJ`
- Test Employer: `GBCAXU7LWG4KIWHIZWJY37P2BZIM52XLWPTPA2R3DLY5VABTQP2TDVRG`

**Explorer Links:**
- USDC SAC: https://stellar.expert/explorer/testnet/contract/CATDCY6NNPYTNKFFURUDALNQRL7PVJSR6EPHGW62CZFDYAOI2SPMKPJM
- Payroll v2: https://stellar.expert/explorer/testnet/contract/CDG4S5FXPKHITU3K2KXKY7WYV3FCRTMV7CTRQ5URFNA4I3VJXUZSQYIN

---

**Ready to proceed with custom test token deployment?** This will resolve the trustline issue and enable instant testing!

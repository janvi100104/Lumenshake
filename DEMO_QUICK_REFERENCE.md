# 🎯 TokenPay Quick Demo Card

> Print this or keep it open during your demo

---

## 🌐 Access Points

| Component | URL/Command |
|-----------|-------------|
| **Web Dashboard** | http://localhost:3000 |
| **Contract Explorer** | https://stellar.expert/explorer/testnet/contract/CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z |
| **Get Test XLM** | https://friendbot.stellar.org/?addr=YOUR_ADDRESS |

---

## 📋 Demo Flow (10 Minutes)

### 1️⃣ Connect Wallet (1 min)
- Open http://localhost:3000
- Click "Connect Freighter Wallet"
- Approve in Freighter

### 2️⃣ Register Employer (2 min)
```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source tokenpay_admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- register_employer \
  --employer YOUR_ADDRESS \
  --kyc_hash 0000000000000000000000000000000000000000000000000000000000000000
```

### 3️⃣ Add Employee (2 min)
```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source tokenpay_admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- add_employee \
  --employer YOUR_ADDRESS \
  --employee EMPLOYEE_ADDRESS \
  --amount 500 \
  --currency USDC
```

### 4️⃣ Deposit USDC (2 min)
```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source tokenpay_admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- deposit_escrow \
  --employer YOUR_ADDRESS \
  --amount 1000
```

### 5️⃣ Run Payroll (1 min)
```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source tokenpay_admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- run_payroll \
  --employer YOUR_ADDRESS \
  --period 1
```

### 6️⃣ Employee Claims (1 min)
```bash
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source employee1 \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- claim_payroll \
  --employee EMPLOYEE_ADDRESS \
  --employer YOUR_ADDRESS \
  --period 1
```

### 7️⃣ Show Explorer (1 min)
- Open: https://stellar.expert/explorer/testnet/contract/CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z
- Show transactions and events

---

## 🔑 Key Information

| Item | Value |
|------|-------|
| Contract ID | `CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z` |
| Network | Stellar Testnet |
| USDC Token | `CDJWVPS2QTPY7D7HPVDU2EFPOHUDW42IADFERCZNTY7NJY7MRZGGRVVH` |

---

## 💬 Key Talking Points

✅ **Problem**: 1.7B unbanked adults can't receive digital payments  
✅ **Solution**: Stellar-based payroll + MoneyGram cash-out  
✅ **Speed**: 3-5 seconds vs. 2-5 days traditional  
✅ **Cost**: <$0.01 vs. $10-50 traditional  
✅ **Compliance**: SEP-10/12 KYC built-in  
✅ **Impact**: Financial inclusion for workers worldwide  

---

## 🚨 Emergency Fallback

If web UI fails → **Use pure CLI demo** (more impressive technically!)

---

## 📞 Quick Verification

```bash
# Check escrow balance
stellar contract invoke \
  --id CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z \
  --source tokenpay_admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- get_escrow_balance
```

---

**You're ready! Good luck! 🚀**

# 🚀 Quick Start - TokenPay Testnet

## Start the App
```bash
cd /home/janviunix/JANVI/project/Lumenshake/web
npm run dev
```
**URL:** http://localhost:3000

---

## Testnet Info
- **Contract ID:** `CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ`
- **Network:** Stellar Testnet
- **Explorer:** https://stellar.expert/explorer/testnet
- **Contract:** https://stellar.expert/explorer/testnet/contract/CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ

---

## Prerequisites
1. ✅ Install Freighter Wallet: https://www.freighter.app/
2. ✅ Switch Freighter to **Testnet**
3. ✅ Fund wallet with test XLM: https://friendbot.stellar.org/?addr=YOUR_ADDRESS
4. ✅ Get test USDC (from another testnet account or Stellar Lab)

---

## Complete Flow (5 Steps)

### 1️⃣ Register Employer
- Connect wallet
- Enter KYC hash (optional)
- Click "Register Employer"
- Approve in Freighter

### 2️⃣ Deposit USDC
- Enter amount (e.g., 1000)
- Click "Deposit to Escrow"
- Approve in Freighter
- ✅ Balance updates!

### 3️⃣ Add Employee
- Enter worker's wallet address (G...)
- Enter salary (e.g., 500)
- Click "Add Employee"
- Approve in Freighter

### 4️⃣ Run Payroll
- Enter period number (e.g., 1)
- Click "Run Payroll"
- Approve in Freighter

### 5️⃣ Worker Claims
- Switch to worker wallet
- Enter employer address + period
- Click "Claim [amount] USDC"
- Approve in Freighter
- ✅ USDC received!

---

## Verify on Blockchain
```
https://stellar.expert/explorer/testnet/contract/CC2E2MCRSXZLDW5LXF6KVJQOBKM7B4NNQRFIEU35TDWBVH5MC3HFTQSZ
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| Account not found | Fund wallet: https://friendbot.stellar.org/?addr=YOUR_ADDRESS |
| Insufficient balance | Get test USDC from another account |
| Freighter not connecting | Refresh page, unlock Freighter |
| Transaction pending | Wait 10-15 seconds, check Explorer |

---

## Full Documentation
- **Testing Guide:** `WEB_UI_TESTING_GUIDE.md`
- **Integration Summary:** `UI_INTEGRATION_SUMMARY.md`
- **Progress Report:** `PROGRESS_REPORT.md`

---

**Need help?** Check `WEB_UI_TESTING_GUIDE.md` for detailed instructions!

# 🚀 TokenPay - Complete Project Guide

## 📋 Quick Reference

### Run Web App (Now - Demo Mode)
```bash
cd /home/janviunix/JANVI/project/Lumenshake/web
npm run dev
```
Visit: http://localhost:3000

### Deploy Smart Contract (After CLI Installs)
```bash
cd /home/janviunix/JANVI/project/Lumenshake
./scripts/deploy.sh
```

---

## 🎯 What is TokenPay?

TokenPay is a **blockchain-based payroll system** built on Stellar that enables:

1. **Cross-border payroll payments** in USDC
2. **Automated payroll distribution** via smart contracts
3. **Bankless cash-out** through MoneyGram (400K+ locations)
4. **Transparent & immutable** payroll records on blockchain

---

## 📁 Project Structure

```
Lumenshake/
├── contracts/payroll_contract/        # Smart Contract (Rust)
│   ├── src/
│   │   ├── lib.rs                    # Main contract (285 lines)
│   │   └── test.rs                   # Unit tests (254 lines)
│   ├── target/.../payroll_contract.wasm  # Compiled (16KB)
│   └── Cargo.toml
│
├── web/                               # Frontend (Next.js)
│   ├── app/page.tsx                   # Main page
│   ├── components/
│   │   ├── WalletConnection.tsx       # Wallet integration
│   │   └── EmployerDashboard.tsx      # Payroll forms
│   └── utils/
│       ├── wallet.ts                  # Wallet hooks
│       └── contract.ts                # Contract wrapper
│
├── scripts/
│   └── deploy.sh                      # Deployment automation
│
├── .env.stellar                       # Stellar network config
├── run.sh                             # Quick start script
└── DEPLOYMENT_GUIDE.md                # Detailed deployment steps
```

---

## 🔄 Current Status

| Component | Status | Location |
|-----------|--------|----------|
| Smart Contract Code | ✅ Complete | `contracts/payroll_contract/src/lib.rs` |
| WASM Binary | ✅ Built (16KB) | `contracts/payroll_contract/target/.../payroll_contract.wasm` |
| Unit Tests | ✅ 12 tests | `contracts/payroll_contract/src/test.rs` |
| Web Dashboard | ✅ Complete | `web/` directory |
| Wallet Integration | ✅ Working | Demo mode active |
| Stellar CLI | 🔄 Installing | `cargo install stellar-cli` |
| Blockchain Deployment | ⏳ Pending | Waiting for CLI |

---

## 🎓 How It Works

### Traditional Payroll vs TokenPay

**Traditional:**
```
Employer → Bank → Wire Transfer → Worker's Bank → Cash
(Takes 3-5 days, high fees, needs bank account)
```

**TokenPay:**
```
Employer → Stellar Smart Contract → Worker's Wallet → MoneyGram → Cash
(Takes 5 seconds, low fees, no bank needed)
```

### Data Flow

```
1. Employer fills form on web dashboard
                ↓
2. Freighter wallet signs transaction
                ↓
3. Transaction sent to Stellar network
                ↓
4. Soroban smart contract executes
                ↓
5. Data stored permanently on blockchain
                ↓
6. Employee can view and claim funds
                ↓
7. Cash out at any MoneyGram location
```

---

## 🛠️ Smart Contract Functions

### 1. `initialize(admin)`
- **Purpose**: Setup contract with admin
- **Called**: Once during deployment
- **Stores**: Admin address

### 2. `register_employer(employer, kyc_hash)`
- **Purpose**: Register employer with KYC
- **Called**: When employer signs up
- **Stores**: `{address, kyc_hash, is_paused}`

### 3. `add_employee(employer, employee, amount, currency)`
- **Purpose**: Add employee to payroll
- **Called**: When employer hires worker
- **Stores**: `{address, salary, currency}`

### 4. `run_payroll(employer, period)`
- **Purpose**: Execute payroll for a period
- **Called**: Each pay cycle
- **Stores**: `{period_id, total_amount}`

### 5. `claim_payroll(employee, employer, period)`
- **Purpose**: Employee claims their pay
- **Called**: By worker to receive funds
- **Stores**: Claim record (prevents double-claim)

### 6. `pause_contract(admin, employer)`
- **Purpose**: Emergency stop (compliance)
- **Called**: By admin if needed
- **Updates**: `is_paused` flag

---

## 💻 Development Workflow

### Phase 1: Environment Setup ✅
- [x] Rust installed
- [x] Node.js installed
- [x] Project structure created
- [x] WASM target configured
- [ ] Stellar CLI (installing now...)

### Phase 2: Smart Contract ✅
- [x] Write contract in Rust
- [x] Implement 7 core functions
- [x] Write 12 unit tests
- [x] Compile to WASM
- [x] Verify build (16KB)

### Phase 3: Deployment 🔄
- [ ] Install Stellar CLI (in progress)
- [ ] Create Stellar identity
- [ ] Fund account via Friendbot
- [ ] Deploy WASM to Futurenet
- [ ] Initialize contract
- [ ] Save contract ID

### Phase 4: Web Dashboard ✅
- [x] Next.js app setup
- [x] Wallet connection (Freighter)
- [x] Employer dashboard UI
- [x] Add employee form
- [x] Run payroll form
- [x] Demo mode working

### Phase 5: Integration ⏳
- [ ] Connect UI to blockchain
- [ ] Implement contract calls
- [ ] Add transaction feedback
- [ ] Error handling
- [ ] Employee dashboard
- [ ] Transaction history

---

## 🚀 How to Use

### For Testing (Right Now):

```bash
# 1. Start web app
cd /home/janviunix/JANVI/project/Lumenshake/web
npm run dev

# 2. Open browser
# Visit: http://localhost:3000

# 3. Click "Connect Wallet"
# Uses demo mode (test address)

# 4. Fill out forms
# Data goes to console.log (F12 to see)
```

### For Production (After Deployment):

```bash
# 1. Deploy contract
cd /home/janviunix/JANVI/project/Lumenshake
./scripts/deploy.sh

# 2. Start web app
./run.sh

# 3. Connect real wallet
# Use Freighter extension

# 4. Fill out forms
# Data goes to Stellar blockchain!
```

---

## 📊 What the Forms Do

### Add Employee Form:
**Inputs:**
- Employee Stellar Address (G...)
- Salary Amount (USDC)

**What happens:**
1. Form data validated
2. Transaction created
3. Wallet signs transaction
4. Sent to Stellar network
5. Contract stores: `employees[(employer, employee)] = {salary: 1000, currency: "USDC"}`
6. Transaction confirmed (~5 seconds)
7. Data is now permanent on blockchain

### Run Payroll Form:
**Inputs:**
- Payroll Period Number

**What happens:**
1. Contract calculates total payroll
2. Creates payroll period record
3. All employees can now claim
4. Stored on blockchain: `payroll_periods[(employer, period)] = {total_amount}`

---

## 🔍 Viewing Blockchain Data

After deployment, you can see all data on:

**Stellar Expert Explorer:**
```
https://stellar.expert/explorer/futurenet/contract/YOUR_CONTRACT_ID
```

**What you'll see:**
- All transactions
- Contract storage
- Employee records
- Payroll history
- Claim records

---

## 🛠️ Useful Commands

### Check CLI Installation:
```bash
soroban --version
# OR
stellar --version
```

### Build Contract:
```bash
cd contracts/payroll_contract
cargo build --target wasm32-unknown-unknown --release
```

### Run Tests:
```bash
cd contracts/payroll_contract
cargo test
```

### Deploy Contract:
```bash
./scripts/deploy.sh
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

## 📝 Configuration Files

### `.env.stellar` - Network Config
```
NETWORK=futurenet
RPC_URL=https://rpc-futurenet.stellar.org
CONTRACT_WASM_PATH=contracts/.../payroll_contract.wasm
```

### `web/.env.local` - Web App Config
```
NEXT_PUBLIC_CONTRACT_ID=<after deployment>
NEXT_PUBLIC_NETWORK=futurenet
NEXT_PUBLIC_RPC_URL=https://rpc-futurenet.stellar.org
```

---

## 🎯 Next Steps

### Immediate (While CLI Installs):
1. ✅ Test web UI in demo mode
2. ✅ Review smart contract code
3. ✅ Read documentation
4. ⏳ Wait for CLI installation

### After CLI Installs:
1. Run `./scripts/deploy.sh`
2. Get contract ID
3. Test contract functions
4. Connect UI to blockchain
5. Full end-to-end testing

### Future Enhancements:
- SEP-31 anchor integration (cross-border)
- MoneyGram API (cash-out)
- Employee dashboard
- Transaction history
- Email notifications
- Multi-sig admin
- Automated payroll scheduling

---

## 📚 Documentation Files

- `README.md` - Project overview
- `DEPLOYMENT_GUIDE.md` - Detailed deployment steps
- `QUICKSTART.md` - 10-minute setup guide
- `SETUP_GUIDE.md` - Complete setup instructions
- `ROADMAP.md` - Development phases
- `PROGRESS.md` - Implementation status
- `PROJECT_GUIDE.md` - This file

---

## 🆘 Troubleshooting

### Web App Not Starting:
```bash
cd web
rm -rf .next node_modules
npm install
npm run dev
```

### Contract Build Fails:
```bash
cd contracts/payroll_contract
cargo clean
cargo build --target wasm32-unknown-unknown --release
```

### CLI Installation Stuck:
- It takes 10-15 minutes to compile
- Check progress: `ps aux | grep cargo`
- Be patient, it's compiling 600+ packages

### Wallet Not Connecting:
- Install Freighter: https://www.freighter.app/
- Use demo mode if not available
- Check browser console (F12) for errors

---

## 💡 Key Concepts

### Smart Contract
A program that runs on the blockchain. Once deployed, it cannot be changed. It stores data and enforces rules automatically.

### Stellar Futurenet
Stellar's test network for testing smart contracts before mainnet. Uses fake XLM for testing.

### Soroban
Stellar's smart contract platform. Allows running Rust code on the blockchain.

### WASM
WebAssembly - the format that smart contracts are compiled to for execution on Soroban.

### Friendbot
A service that gives free test XLM to accounts on testnet for testing.

---

## 🎉 Success Criteria

The project is fully working when:

1. ✅ Smart contract deployed to Futurenet
2. ✅ Web app running on localhost:3000
3. ✅ Can connect wallet
4. ✅ Can add employee → Data on blockchain
5. ✅ Can run payroll → Transaction confirmed
6. ✅ Can view data on Stellar Explorer
7. ✅ Employee can claim payroll

---

**Current Focus**: Waiting for Stellar CLI to finish installing, then deploy to blockchain!

# TokenPay - Stellar-Powered Cross-Border Payroll System

> Employers pay workers in USDC on Stellar, workers cash out at any MoneyGram location—no bank account needed.

## 🎯 What is TokenPay?

TokenPay is a decentralized payroll system built on Stellar's Soroban smart contract platform that enables:
- **Cross-border payments** with USDC on Stellar
- **Automated payroll distribution** via smart contracts
- **Bankless cash-out** through MoneyGram's 400K+ locations
- **Compliance-ready** with KYC/AML integration (SEP-12, SEP-31)

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Employer    │────▶│  Soroban     │────▶│  Worker      │
│  Dashboard   │     │  Contract    │     │  Wallet      │
└──────────────┘     └──────────────┘     └──────────────┘
       │                     │                    │
       ▼                     ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  SEP-31      │     │  SEP-24      │     │ MoneyGram    │
│  Anchor      │     │  Deposit     │     │ Cash-Out     │
│  (KYC/AML)   │     │  (On-Ramp)   │     │ (400K+ Loc)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

## 📦 Project Structure

```
Lumenshake/
├── contracts/
│   └── payroll_contract/        # Soroban smart contract (Rust)
│       ├── src/
│       │   ├── lib.rs           # Main contract implementation
│       │   └── test.rs          # Unit tests
│       └── Cargo.toml           # Rust dependencies
├── web/                         # Next.js employer dashboard
│   ├── app/
│   │   └── page.tsx             # Main page
│   ├── components/
│   │   ├── WalletConnection.tsx # Freighter wallet integration
│   │   └── EmployerDashboard.tsx # Employer UI
│   └── utils/
│       ├── wallet.ts            # Wallet hooks
│       └── contract.ts          # Contract interaction
├── docs/                        # Documentation
│   └── Plan                     # Development plan
├── ROADMAP.md                   # Detailed roadmap
└── SETUP_GUIDE.md              # Setup instructions
```

## 🚀 Quick Start

### 1. Build Smart Contract

```bash
cd contracts/payroll_contract
cargo build --target wasm32-unknown-unknown --release
cargo test
```

### 2. Deploy to Futurenet

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payroll_contract.wasm \
  --source employer \
  --rpc-url https://rpc-futurenet.stellar.org/ \
  --network futurenet
```

### 3. Run Web Dashboard

```bash
cd web
npm install
npm run dev
```

Visit: http://localhost:3000

## 📋 Features

### Smart Contract (Phase 2 ✅ Complete)
- ✅ `register_employer` - Register employer with KYC hash
- ✅ `add_employee` - Add employees to payroll
- ✅ `run_payroll` - Execute payroll distribution
- ✅ `claim_payroll` - Employee claims funds
- ✅ `pause_contract` - Emergency pause function
- ✅ Unit tests with comprehensive coverage

### Web Dashboard (Phase 4 🚧 In Progress)
- ✅ Wallet connection (Freighter)
- ✅ Employer dashboard UI
- ✅ Add employee form
- ✅ Run payroll interface
- 🚧 Contract integration (pending deployment)

### Coming Soon (Phase 5)
- ⏳ Full contract integration
- ⏳ Transaction history
- ⏳ Error handling & loading states
- ⏳ SEP-31 cross-border payments
- ⏳ MoneyGram API integration

## 🛠️ Tech Stack

- **Smart Contract**: Rust + Soroban SDK
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Wallet**: Freighter (Stellar Web3 Wallet)
- **Network**: Stellar Futurenet (Testnet)
- **Payment Standard**: SEP-31, SEP-24

## 📖 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Complete setup and deployment instructions
- [Roadmap](ROADMAP.md) - Detailed development phases
- [Soroban Docs](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Stellar SDK](https://stellar.github.io/js-stellar-sdk/)

## 🧪 Testing

### Contract Tests
```bash
cd contracts/payroll_contract
cargo test
```

### Test Coverage
- ✅ Contract initialization
- ✅ Employer registration
- ✅ Employee management
- ✅ Payroll execution
- ✅ Claim processing
- ✅ Emergency pause
- ✅ Full payroll flow

## 🌐 Network Configuration

| Network | RPC URL | Friendbot |
|---------|---------|-----------|
| Futurenet | https://rpc-futurenet.stellar.org/ | https://friendbot.stellar.org/ |
| Testnet | https://soroban-testnet.stellar.org/ | https://friendbot.stellar.org/ |

## 🤝 Contributing

1. Follow the roadmap in [ROADMAP.md](ROADMAP.md)
2. Write tests for new features
3. Ensure contract builds successfully
4. Update documentation

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Stellar Development Foundation
- Soroban SDK Team
- Freighter Wallet Team
- MoneyGram API

---

**Built with ❤️ on Stellar Soroban**

# Lumenshake - Stellar-Powered Cross-Border Payroll System

> Employers pay workers in USDC on Stellar, workers cash out at any MoneyGram location—no bank account needed.

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](http://localhost:3000)
[![Network](https://img.shields.io/badge/Network-Stellar%20Testnet-blue)](https://stellar.expert/explorer/testnet/contract/CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Feedback](https://img.shields.io/badge/Feedback-Share%20Thoughts-orange)](https://forms.gle/4h4EiXHue2EvKZt59)

## 🎯 What is Lumenshake?

Lumenshake is a decentralized payroll system built on Stellar's Soroban smart contract platform that enables:
- **Cross-border payments** with USDC on Stellar
- **Automated payroll distribution** via smart contracts
- **Bankless cash-out** through MoneyGram's 400K+ locations
- **Compliance-ready** with KYC/AML integration (SEP-10, SEP-12, SEP-24, SEP-31)

### 💡 Key Benefits
- ⚡ **Fast**: 3-5 second settlement vs. 2-5 days traditional
- 💰 **Cheap**: <$0.01 per transaction vs. $10-50 traditional
- 🌍 **Global**: Works anywhere, no geographic restrictions
- 🔒 **Secure**: Smart contract escrow with emergency controls
- 🏦 **Bankless**: 1.7B unbanked adults can receive payments
- ✅ **Compliant**: Built-in SEP-10/12 authentication and KYC

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

### Prerequisites

- Rust (v1.70+)
- Stellar CLI (`cargo install stellar-cli`)
- Node.js (v18+)
- Freighter Wallet (browser extension)
- PostgreSQL (for backend API)

### 1. Build & Test Smart Contract

```bash
cd contracts/payroll_contract
cargo build --target wasm32-unknown-unknown --release
cargo test
```

### 2. Deploy to Testnet

```bash
# Deploy contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payroll_contract.wasm \
  --source YOUR_IDENTITY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# Initialize contract
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source YOUR_IDENTITY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- \
  initialize \
  --admin YOUR_ADDRESS \
  --usdc_token CDJWVPS2QTPY7D7HPVDU2EFPOHUDW42IADFERCZNTY7NJY7MRZGGRVVH
```

### 3. Start Web Dashboard

```bash
cd web
npm install
npm run dev
```

Visit: **http://localhost:3000**

### 4. Start Backend API (Optional)

```bash
cd backend
npm install
npm run migrate  # First time only
npm start
```

Backend runs on: **http://localhost:4000**

## 📋 Features

### ✅ Smart Contract (100% Complete)
- ✅ `initialize` - Contract setup with admin and USDC token
- ✅ `register_employer` - Register employer with KYC hash
- ✅ `add_employee` - Add employees to payroll
- ✅ `run_payroll` - Execute payroll distribution
- ✅ `claim_payroll` - Employee claims USDC funds
- ✅ `deposit_escrow` - Fund payroll escrow
- ✅ `pause_contract` - Emergency pause function
- ✅ `emergency_withdraw` - Admin recovery mechanism
- ✅ `get_escrow_balance` - View escrow balance
- ✅ Comprehensive unit tests (12 tests passing)
- ✅ **Deployed on Stellar Testnet**

### ✅ Backend API (95% Complete)
- ✅ SEP-10 Web Authentication (JWT-based)
- ✅ SEP-12 KYC Customer Management
- ✅ SEP-24 Interactive Deposits/Withdrawals
- ✅ SEP-31 Cross-Border Payments
- ✅ MoneyGram Cash-Out Integration
- ✅ Security Middleware (Rate limiting, audit, validation)
- ✅ Webhook System for event notifications
- ✅ PostgreSQL database with migrations

### ✅ Web Dashboard (90% Complete)
- ✅ Freighter wallet connection
- ✅ Employer dashboard UI
- ✅ Worker dashboard UI
- ✅ Cash-out dashboard (MoneyGram)
- ✅ Add employee form
- ✅ Run payroll interface
- ✅ SEP-10 authentication tool
- ⚠️ Full blockchain integration (in progress)

### 📊 Project Completion: ~88%

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Smart Contract** | Rust + Soroban SDK |
| **Frontend** | Next.js 16 + TypeScript + Tailwind CSS |
| **Backend** | Node.js + Express + PostgreSQL |
| **Wallet** | Freighter (Stellar Web3 Wallet) |
| **Network** | Stellar Testnet |
| **Payment Standards** | SEP-10, SEP-12, SEP-24, SEP-31 |
| **Authentication** | JWT + SEP-10 Web Auth |
| **Compliance** | KYC/AML Integration |

## 📖 Documentation

### Getting Started
- [Quick Start Guide](QUICKSTART.md) - Get up and running in 10 minutes
- [Setup Guide](SETUP_GUIDE.md) - Complete setup instructions
- [Demo Guide](DEMO_GUIDE.md) - Step-by-step demo instructions
- [SEP-10 Auth Guide](SEP10_AUTH_GUIDE.md) - Authentication walkthrough

### Technical Documentation
- [Project Guide](docs/PROJECT_GUIDE.md) - Complete project overview
- [Progress Report](docs/PROGRESS_REPORT.md) - Current status and roadmap
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Deployment instructions
- [Testing Guide](docs/TESTING_GUIDE.md) - Testing procedures

### Integration Guides
- [SEP-24/31 Guide](backend/SEP24_SEP31_GUIDE.md) - Anchor integration
- [MoneyGram Guide](backend/MONEYGRAM_GUIDE.md) - Cash-out integration

### External Resources
- [Soroban Docs](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Stellar SDK](https://stellar.github.io/js-stellar-sdk/)
- [SEP-10 Spec](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md)
- [SEP-12 Spec](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md)
- [SEP-24 Spec](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md)
- [SEP-31 Spec](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md)

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

## 🌐 Live Deployment

### Testnet Contract
- **Contract ID**: `CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z`
- **Network**: Stellar Testnet
- **Explorer**: [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z)
- **RPC URL**: https://soroban-testnet.stellar.org
- **USDC Token**: `CDJWVPS2QTPY7D7HPVDU2EFPOHUDW42IADFERCZNTY7NJY7MRZGGRVVH`

### Local Development
- **Web Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **SEP-10 Auth Tool**: [sep10-auth-tool.html](sep10-auth-tool.html)

### Testnet Resources
| Resource | URL |
|----------|-----|
| Get Test XLM | https://friendbot.stellar.org/?addr=YOUR_ADDRESS |
| Stellar Explorer | https://stellar.expert/explorer/testnet |
| Stellar Laboratory | https://laboratory.stellar.org/ |
| Freighter Wallet | https://www.freighter.app/ |

## 🎬 Demo the Project

### Quick Demo (10 minutes)
1. **Start Web Dashboard**: `cd web && npm run dev`
2. **Open Browser**: http://localhost:3000
3. **Connect Wallet**: Click "Connect Freighter Wallet"
4. **Run Payroll Flow**: Register → Add Employee → Deposit USDC → Run Payroll → Claim
5. **Verify on Blockchain**: [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z)

### Detailed Demo Guide
See [DEMO_GUIDE.md](DEMO_GUIDE.md) for complete step-by-step instructions with:
- Full demo script (10-15 minutes)
- CLI commands for each step
- Talking points and Q&A
- Troubleshooting tips
- Blockchain verification

### Demo Tools
- 🎯 [Quick Reference Card](DEMO_QUICK_REFERENCE.md) - Keep open during demo
- 🔐 [SEP-10 Auth Tool](sep10-auth-tool.html) - Web-based authentication
- 🔍 [Demo Verify Script](demo-verify.sh) - Pre-demo checklist

## 💬 Share Your Feedback

We'd love to hear your thoughts on Lumenshake! Your feedback helps us improve the platform.

### 📝 Feedback Form
Share your thoughts, suggestions, and report issues:
**[📊 Submit Feedback via Google Form](https://forms.gle/4h4EiXHue2EvKZt59)**

### 📈 View Feedback Data
See all collected feedback and responses:
**[📄 View Feedback Spreadsheet](https://docs.google.com/spreadsheets/d/1MW2XCGREFD10hfBYo1vDOeq6A2rcvsNM12O45H7A4fs/edit?resourcekey=&gid=412778729#gid=412778729)**

Your input on:
- User experience
- Feature requests
- Bug reports
- General suggestions

is highly appreciated! 🙏

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Follow the Roadmap**: Check [ROADMAP.md](ROADMAP.md) for planned features
2. **Write Tests**: All new features must include tests
3. **Build Successfully**: Ensure contract and web app build without errors
4. **Update Documentation**: Keep docs in sync with code changes
5. **Submit PR**: Create a pull request with clear description

### Development Workflow
```bash
# Fork and clone the repository
git clone git@github.com:YOUR_USERNAME/Lumenshake.git
cd Lumenshake

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
cargo test  # Contract tests
npm run dev # Web dashboard

# Commit and push
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- **Stellar Development Foundation** - For building the Stellar network
- **Soroban SDK Team** - For the smart contract platform
- **Freighter Wallet Team** - For the Stellar Web3 wallet
- **MoneyGram** - For cash-out infrastructure
- **Stellar Community** - For support and feedback

---

## 📞 Contact & Support

- **Project Repository**: [github.com/janvi100104/Lumenshake](https://github.com/janvi100104/Lumenshake)
- **Stellar Discord**: https://discord.gg/stellardev
- **Feedback Form**: https://forms.gle/4h4EiXHue2EvKZt59
- **Feedback Spreadsheet**: https://docs.google.com/spreadsheets/d/1MW2XCGREFD10hfBYo1vDOeq6A2rcvsNM12O45H7A4fs/edit
- **Email**: Create an issue on GitHub

---

**Built with ❤️ on Stellar Soroban**

⭐ **If you find this project useful, please consider giving it a star on GitHub!**

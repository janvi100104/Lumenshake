# 🌟 LumenShake

**Global Payroll Platform on Stellar Network**

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](http://localhost:3000)
[![Network](https://img.shields.io/badge/Network-Stellar%20Testnet-blue)](https://stellar.expert/explorer/testnet)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-1c48f7.svg)](https://stellar.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg)](https://postgresql.org)
[![Rust](https://img.shields.io/badge/Rust-Soroban-orange.svg)](https://soroban.stellar.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📖 Overview

LumenShake is a comprehensive blockchain-based payroll platform that enables employers to pay workers globally using USDC stablecoins on Stellar, with seamless cash-out to local fiat via MoneyGram.

### ✨ Key Features

- **🏠 Professional Landing Page** - Beautiful marketing site with wallet integration
- ** 5-Tab Dashboard** - Overview, PayRoll, Team, Ledger, CashOut
- ** Smart Contract Payroll** - Soroban-based automated distributions
- **🌍 MoneyGram Cash-Out** - Convert USDC to local fiat in 200+ countries
- **🔐 SEP-10 Authentication** - Industry-standard Stellar wallet auth
- **👤 KYC/AML Compliance** - Built-in SEP-12 customer verification
- **💸 Cross-Border Payments** - SEP-31 international remittances
- **📜 Transaction Ledger** - Complete on-chain audit trail
- **🔄 Auto-Sync** - Smart contract ↔ Database synchronization
- **📈 Real-time Monitoring** - Prometheus/Grafana dashboards
- **️ Security First** - Rate limiting, validation, encryption, audit logs

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Rust & Soroban CLI (for contract development)
- Freighter Wallet (browser extension)
- Docker & Docker Compose (optional, for monitoring)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/LumenShake.git
cd LumenShake

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../web
npm install

# 4. Install contract dependencies (if developing contracts)
cd ../contracts/payroll_contract
cargo build

# 5. Setup environment
cd ../../backend
cp .env.example .env  # Or edit existing .env
# Update with your configuration
```

### Database Setup

```bash
# Create database
sudo -u postgres createdb lumenshake

# Run migrations
cd backend
node src/database/migrate.js

# Seed test data (optional)
node scripts/onboard-users.js
node scripts/fund-accounts.js
```

### Start Services

```bash
# Terminal 1: Backend API
cd backend
npm start
# Runs on http://localhost:4000

# Terminal 2: Frontend
cd web
npm run dev
# Runs on http://localhost:3000

# Terminal 3: Background Worker (optional)
cd backend
node src/worker.js

# Terminal 4: Monitoring (optional)
cd monitoring
./setup.sh
```

### Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **API Health:** http://localhost:4000/health
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001 (admin/admin)

---



## 🎯 Core Features

### 1. Landing Page

Professional marketing site that appears when users first visit:

- **Header** - LumenShake branding with gradient text
- **Hero** - "Automate Payroll. Enable Employees."
- **Utility Spotlight** - Network visualization + 4 key features
- **FAQ Section** - 4 interactive accordion questions
- **Connect Wallet** - Freighter integration button
- **Auto-Redirect** - Switches to Dashboard on wallet connect

### 2. Dashboard (5 Tabs)

#### 📊 Overview Tab
- Real-time escrow balance
- Total employees count
- Payroll periods completed
- Pending claims
- Connect wallet banner (if not connected)

#### 💰 PayRoll Tab
- Run payroll for specific period
- Deposit to escrow
- Contract run history
- Bar chart visualization
- Form with period & amount

#### 👥 Team Tab
- Employee table (8 columns)
- Add new employee modal
- Register employer functionality
- KYC status indicators
- Salary & claim status
- Blockchain ops sidebar
- MoneyGram cash-out ready panel

#### 📜 Ledger Tab
- Transaction history table
- Tx hash with explorer links
- Auto-refresh every 10 seconds
- Soroban contract state panel
- Network info panel
- Transaction statistics

#### 💸 CashOut Tab
- USDC → Fiat conversion
- MoneyGram integration
- Amount input
- Currency selection- Country/location picker
- Step-by-step wizard
- Tracking number display

### 3. Smart Contract (Soroban/Rust)

**Location:** `contracts/payroll_contract/src/lib.rs`

**Functions:**
- `register_employer()` - Register new employer
- `add_employee()` - Add employee with salary
- `run_payroll()` - Execute payroll distribution
- `claim_payroll()` - Worker claims payment
- `deposit_escrow()` - Fund escrow account
- `get_employer()` - Query employer data
- `get_employee()` - Query employee data
- `get_escrow_balance()` - Check escrow balance
- `get_payroll_period()` - Query period data

**Error Codes:**
- #1: AlreadyRegistered
- #2: NotRegistered
- #3: NotAuthorized
- #4: EmployeeAlreadyExists
- #5: EmployeeNotFound
- #6: PayrollAlreadyRun
- #7: NoPayrollToClaim
- #8: ContractPaused
- #9: InvalidAmount
- #10: AlreadyInitialized
- #11: AlreadyClaimed
- #12: InsufficientEscrowBalance
- #13: MaxAmountExceeded
- #14: InvalidAddress

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Smart contract tests
cd contracts/payroll_contract
cargo test

# Load tests
cd backend
node load-test.js

# SEP-10 auth demo
cd backend
./scripts/sep10-auth-demo.sh

# Demo verification
cd scripts
./demo-verify.sh
```

---
📜 Smart Contract Addresses
Network	Contract Address	Explorer
Testnet	CCRD5GASTD5IQQPX2ELACIYQRTHQDPWMPFG7AWNWVRP5F6CRT2L3SEAJ   Stellar Expert
Mainnet	COMING_SOON	-


##  Monitoring

### Prometheus Metrics

- HTTP request rate & duration
- Active requests
- Error rates
- Business transactions (payroll, MoneyGram)
- System health (CPU, memory, database)

### Grafana Dashboards

- Real-time metrics visualization
- Historical trends
- Alert status
- System performance

### Start Monitoring

```bash
cd monitoring
./setup.sh

# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001
# Alertmanager: http://localhost:9093
```

---

## 🌐 Stellar SEP Standards

| SEP | Standard | Status | Description |
|-----|----------|--------|-------------|
| **SEP-10** | Authentication | ✅ Complete | Web authentication using Stellar |
| **SEP-12** | KYC/AML | ✅ Complete | Customer information |
| **SEP-24** | Interactive Payments | ✅ Complete | Deposits & withdrawals |
| **SEP-31** | Cross-Border | ✅ Complete | Send payments |

---

## 🛡️ Security

### Security

**Implemented:**
- ✅ SEP-10 Authentication
- ✅ Rate Limiting (strict/standard)
- ✅ Input Validation & Sanitization
- ✅ SQL Injection Prevention (parameterized queries)
- ✅ CORS Protection
- ✅ Security Headers (HSTS, CSP, X-Frame-Options)
- ✅ Data Encryption (AES-256 for sensitive data)
- ✅ Audit Logging (all critical actions)
- ✅ Idempotency Keys (prevent duplicate requests)
- ✅ KYC Gate middleware
- ✅ Transaction logging & audit trail

---

## 📈 Performance

### Query Performance (with indexing)

| Operation | Time | Improvement |
|-----------|------|-------------|
| User lookup | 1ms | 50x faster |
| Transaction history | 5ms | 40x faster |
| Status polling | 10ms | 50x faster |
| Date range queries | 15ms | 66x faster |

### Database

- **Tables:** 19
- **Indexes:** 39 active
- **Migrations:** 8 (all passing)

---


## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/PROJECT_GUIDE.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write tests
5. Commit using conventional commits
6. Push to the branch
7. Open a Pull Request

### Code Style

- ESLint configured for code quality
- Prettier for consistent formatting
- Conventional commits for clear history

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Stellar Development Foundation** - Stellar network and SDKs
- **MoneyGram** - Cash-out integration
- **Freighter Wallet** - Wallet integration
- **Soroban** - Smart contract platform

---

##  Support

- **Repository:** https://github.com/janvi100104/LumenShake
- **Issues:** https://github.com/janvi100104/LumenShake/issues
- **Discussions:** https://github.com/janvi100104/LumenShake/discussions
- **Email:** janvisinghal10@gmail.com
- **Stellar Discord:** https://discord.gg/stellardev

### 📝 Feedback

We value your feedback! Help us improve LumenShake:

- **📋 Submit Feedback:** [Google Form](https://forms.gle/Wr1L7tLG7CEkvQZx9)
- **📊 View Responses:** [Feedback Spreadsheet](https://docs.google.com/spreadsheets/d/1PsHztWKXBd4vVPzIIuzmMXyfw2eG8goRqEGx3QfPeAw/edit?resourcekey#gid=1715253295)

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-29  
**Status:** Active Development  
**Network:** Stellar Testnet

---

<div align="center">

**Built with ❤️ on Stellar**

[Documentation](docs/) • [Support](mailto:janvisinghal10@gmail.com)

</div>

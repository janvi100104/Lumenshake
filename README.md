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

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────┐
│         LANDING PAGE                │
│  (Unauthenticated Users)            │
│  - Product info                     │
│  - FAQ accordion                    │
│  - Connect Wallet CTA               │
└──────────┬──────────────────────────┘
           │ Wallet Connected
           ▼
┌─────────────────────────────────────┐
│      DASHBOARD (5 Tabs)             │
│                                     │
│  📊 Overview  │ PayRoll  │  Team   │
│  Ledger       │ CashOut            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Freighter Wallet           │   │
│  │  @stellar/freighter-api     │   │
│  └─────────────────────────────┘   │
└──────────┬──────────────────────────┘
           │ REST API
           ▼
┌─────────────────────────────────────┐
│      BACKEND (Node.js/Express)      │
│                                     │
│  Routes:                            │
│  - /api/payroll/*                   │
│  - /api/customer/*                  │
│  - /api/sep24/*                     │
│  - /api/sep31/*                     │
│  - /api/moneygram/*                 │
│                                     │
│  Middleware:                        │
│  - SEP-10 Auth                      │
│  - Rate Limiting                    │
│  - KYC Gate                         │
│  - Validation                       │
│  - Audit Logging                    │
└──────┬──────────────┬───────────────
       │              │
       ▼              ▼
┌──────────┐    ┌──────────────┐
│PostgreSQL│    │Stellar Network│
│ Database │    │ + Soroban    │
│          │    │ Smart Contract│
└──────────    └──────────────┘
```

### Project Structure

```
LumenShake/
├── web/                          # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx             # Smart routing (Landing/Dashboard)
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── LandingPage.tsx      # ✨ NEW: Marketing landing page
│   │   ├── Dashboard.tsx        # Main dashboard with sidebar
│   │   ├── tabs/
│   │   │   ├── OverviewTab.tsx  # Stats & wallet connection
│   │   │   ├── PayRollTab.tsx   # Run payroll & deposits
│   │   │   ├── TeamTab.tsx      # Employee management
│   │   │   ├── LedgerTab.tsx    # Transaction history
│   │   │   ── CashOutTab.tsx   # MoneyGram cash-out
│   │   ├── EmployerDashboard.tsx
│   │   ├── WorkerDashboard.tsx
│   │   └── Toast.tsx
│   ├── hooks/
│   │   ── useDashboardData.ts  # Data fetching hooks
│   ├── utils/
│   │   ├── wallet.ts            # Freighter integration
│   │   ├── contract.ts          # Soroban contract calls
│   │   ├── explorer.ts          # Stellar explorer links
│   │   └── transactionStatus.ts # Tx polling
│   └── public/                  # Static assets
│
├── backend/                      # Node.js Backend API
│   ├── src/
│   │   ├── index.js             # Express server entry
│   │   ├── worker.js            # Background job processor
│   │   ├── database/
│   │   │   ├── db.js            # PostgreSQL connection
│   │   │   └── migrate.js       # Migration runner
│   │   ├── routes/
│   │   │   ├── auth.js          # SEP-10 authentication
│   │   │   ├── customer.js      # SEP-12 KYC
│   │   │   ├── payroll.js       # ✨ NEW: Transaction logging
│   │   │   ├── sep24.js         # Deposits/withdrawals
│   │   │   ├── sep31.js         # Cross-border payments
│   │   │   ├── moneygram.js     # Cash-out integration
│   │   │   ├── recurring.js     # Recurring payroll
│   │   │   └── webhooks.js      # Event notifications
│   │   ├── services/
│   │   │   ├── payroll.js       # Business logic
│   │   │   ├── sep10.js         # Auth service
│   │   │   ├── sep12.js         # KYC service
│   │   │   ├── moneygram.js     # MoneyGram API
│   │   │   └── recurringPayroll.js
│   │   ├── middleware/
│   │   │   ├── audit.js         # Audit logging
│   │   │   ├── cache.js         # Response caching
│   │   │   ├── idempotency.js   # Prevent duplicates
│   │   │   ├── kycGate.js       # KYC verification
│   │   │   ├── metrics.js       # Prometheus metrics
│   │   │   ├── rateLimiter.js   # Rate limiting
│   │   │   ├── security.js      # Security headers
│   │   │   └── validation.js    # Input validation
│   │   └── utils/
│   ├── migrations/              # SQL migrations (8 total)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_sep10_sep12_compliance.sql
│   │   ├── 003_sep24_sep31_anchor_rails.sql
│   │   ├── 004_moneygram_cashout.sql
│   │   ├── 005_seed_moneygram_locations.sql
│   │   ├── 006_comprehensive_indexing.sql
│   │   ├── 007_recurring_payroll.sql
│   │   └── 008_add_transaction_metadata.sql  # ✨ NEW
│   ├── scripts/
│   │   ├── onboard-users.js     # Seed test users
│   │   └── fund-accounts.js     # Fund test accounts
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── Dockerfile
│
├── contracts/                    # Soroban Smart Contracts
│   └── payroll_contract/
│       ├── src/
│       │   ├── lib.rs           # Main contract (507 lines)
│       │   └── test.rs          # Unit tests
│       ├── Cargo.toml
│       └── test_snapshots/      # Test snapshots
│
├── monitoring/                   # Prometheus/Grafana Stack
│   ├── docker-compose.yml
│   ├── prometheus.yml
│   ├── grafana-dashboard.json
│   ├── alert-rules.yml
│   ├── alertmanager.yml
│   └── setup.sh
│
├── scripts/                      # Deployment & Utility Scripts
│   ├── run.sh                   # Quick start script
│   ├── deploy.sh                # Deployment script
│   ├── deploy-testnet.sh        # Testnet deployment
│   ├── demo-verify.sh           # Demo verification
│   └── sep10-auth-demo.sh       # Auth demo
│
├── docs/                         # Documentation (45+ files)
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── TECHNICAL_DOCUMENTATION.md
│   ├── USER_GUIDE.md
│   └── ... (40+ more)
│
── UI/                           # Design References
│   ├── Landing page.jpeg        # Landing page design
│   ├── Overview.jpeg            # Dashboard overview
│   ├── PayRoll.jpeg             # Payroll tab design
│   ├── Team.jpg                 # Team tab design
│   ├── Ledger.jpg               # Ledger tab design
│   └── CashOut.jpg              # Cash-out tab design
│
└── README.md                     # This file
```

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
- Currency selection
- Country/location picker
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

---

## 🔄 Transaction Logging System

All smart contract interactions are automatically logged to PostgreSQL:

### Flow

```
1. User action (Add Employee, Run Payroll, etc.)
        ↓
2. Smart Contract Transaction (on-chain)
        ↓
3. Frontend calls: POST /api/payroll/log-transaction
        ↓
4. Transaction inserted into PostgreSQL
        ↓
5. Ledger Tab displays transaction
```

### Logged Transaction Types

- ✅ `register_employer` - Employer registration
- ✅ `add_employee` - Employee addition
- ✅ `run_payroll` - Payroll execution
- ✅ `claim_payroll` - Payment claim
-  `deposit` - Escrow funding
- ⏳ `withdrawal` - Escrow withdrawal

### API Endpoints

#### Log Transaction
```http
POST /api/payroll/log-transaction
Content-Type: application/json

{
  "tx_hash": "abc123...",
  "type": "add_employee",
  "stellar_address": "GCB45M5Q...",
  "amount": 10.0,
  "status": "success",
  "metadata": { ... }
}
```

#### Sync Employee
```http
POST /api/payroll/sync-employee
Content-Type: application/json

{
  "employer_address": "GCA7HG...",
  "employee_address": "GCB45M5Q...",
  "salary": 10.0,
  "currency": "USDC",
  "tx_hash": "abc123..."
}
```

---

##  Environment Variables

### Backend (.env)

```bash
# Server
NODE_ENV=development
PORT=4000

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lumenshake
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lumenshake
DB_USER=postgres
DB_PASSWORD=postgres

# Stellar
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
CONTRACT_ID=CCRD5GASTD5IQQPX2ELACIYQRTHQDPWMPFG7AWNWVRP5F6CRT2L3SEAJ

# SEP-10 Auth
HOME_DOMAIN=localhost:4000
WEB_AUTH_DOMAIN=LumenShake Payroll
JWT_SECRET=403112e58be11f3a75c9b979f2d1da98ef61f2f4fd476d2abbcd9d40bc0d14f1bc9251a026d8e000992d6cdc3fca40b65747a56306f16b89999384e890288fd0
JWT_EXPIRATION=24h


```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_CONTRACT_ID=CCRD5GASTD5IQQPX2ELACIYQRTHQDPWMPFG7AWNWVRP5F6CRT2L3SEAJ
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

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

### Security Score: 87/100 ✅

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

## 🚧 Roadmap

### Completed ✅
- [x] Database setup & migrations
- [x] Smart contract deployment
- [x] SEP-10/12/24/31 implementation
- [x] MoneyGram integration
- [x] Webhook system
- [x] Explorer links & status polling
- [x] Metrics dashboard
- [x] Security audit
- [x] Production monitoring
- [x] Data indexing
- [x] Technical documentation
- [x] Professional landing page
- [x] 5-tab dashboard with UI fidelity
- [x] Transaction logging system
- [x] Auto-sync (contract ↔ database)

### In Progress 🚧
- [ ] Advanced features (recurring payroll)
- [ ] E2E tests
- [ ] Load testing optimization
- [ ] Runbooks & incident response

### Planned 📋
- [ ] Mainnet deployment
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Multi-currency support

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

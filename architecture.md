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

# Project Structure 

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

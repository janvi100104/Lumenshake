# 🌟 Lumenshake

**Stellar-based Payroll & Remittance Platform**

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](http://localhost:3000)
[![Network](https://img.shields.io/badge/Network-Stellar%20Testnet-blue)](https://stellar.expert/explorer/testnet/contract/CBHNF7LHWNUWW77T2EVGMXOPJ5HHQXU3JNMS5MX5PI5XRHX4WGM46V7Z)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-1c48f7.svg)](https://stellar.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Feedback](https://img.shields.io/badge/Feedback-Share%20Thoughts-orange)](https://forms.gle/Jgji7Pe1AiTKJXEi6)

---

## 📖 Overview

Lumenshake is a comprehensive platform that enables employers to pay workers anywhere in the world using USDC stablecoins on the Stellar blockchain, with seamless cash-out to local fiat currency via MoneyGram.

### ✨ Key Features

- **🏢 Employer Payroll** - Create payroll periods, add employees, run automated distributions
- **💰 Worker Payments** - Instant USDC payments with ~5 second confirmation
- **🌍 Global Cash-Out** - MoneyGram integration for fiat withdrawal in 200+ countries
- **🔐 SEP-10 Authentication** - Industry-standard Stellar authentication
- **👤 KYC/AML Compliance** - Built-in SEP-12 customer verification
- **💸 Cross-Border Payments** - SEP-31 international remittances
- **📊 Real-time Monitoring** - Prometheus/Grafana dashboards and alerting
- **🔔 Webhook Integration** - Event notifications for your systems
- **🛡️ Security First** - Rate limiting, input validation, encryption, audit logging



## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Docker & Docker Compose (optional, for monitoring)
- Stellar testnet account

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/Lumenshake.git
cd Lumenshake

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../web
npm install

# 4. Setup environment
cd ../backend
cp .env.example .env
# Edit .env with your configuration
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
node src/index.js

# Terminal 2: Background Worker
cd backend
node src/worker.js

# Terminal 3: Frontend (optional)
cd web
npm run dev

# Terminal 4: Monitoring (optional)
cd monitoring
./setup.sh
```

### Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001 (admin/admin)
- **API Docs:** [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

---

## 📚 Documentation

### For Users
- [📖 User Guide](docs/USER_GUIDE.md) - Step-by-step guides for employers and workers
- [💵 MoneyGram Cash-Out](docs/USER_GUIDE.md#moneygram-cash-out) - How to cash out to local currency
- [❓ FAQs](docs/USER_GUIDE.md#faqs) - Frequently asked questions

### For Developers
- [🔧 Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) - Complete technical reference
- [📡 API Reference](docs/API_REFERENCE.md) - All endpoints with examples
- [🧪 Testing Guide](docs/TESTING_GUIDE.md) - How to run tests
- [🚀 Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment steps

### For Contributors
- [📋 Project Guide](docs/PROJECT_GUIDE.md) - Architecture and development workflow
- [🛣️ Roadmap](docs/ROADMAP.md) - Feature roadmap and timeline
- [📝 Progress](docs/PROGRESS.md) - Development progress tracking

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  Next.js + TypeScript
│   (Next.js)     │  Tailwind CSS + Freighter
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│   Backend       │  Node.js + Express
│   (Express)     │  SEP-10/12/24/31
└────┬───────┬────┘
     │       │
     ▼       ▼
┌──────────┐ ┌──────────────┐
│PostgreSQL│ │Stellar Network│
│ Database │ │ + Soroban     │
└──────────┘ └──────────────┘

┌─────────────────────────────┐
│   Monitoring Stack          │
│   Prometheus + Grafana      │
│   Alertmanager              │
└─────────────────────────────┘
```

### Project Structure

```
Lumenshake/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── database/    # Database & migrations
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   ├── migrations/      # SQL migrations
│   ├── scripts/         # Utility scripts
│   └── logs/            # Application logs
├── web/                 # Next.js frontend
│   ├── app/             # Pages
│   ├── components/      # React components
│   └── utils/           # Utilities
├── contracts/           # Soroban smart contracts
│   └── payroll_contract/
├── monitoring/          # Prometheus/Grafana stack
├── docs/                # Documentation
└── scripts/             # Deployment scripts
```

---

## 🔑 Environment Variables

### Backend (.env)

```bash
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/lumenshake
JWT_SECRET=your-secret-key
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
CONTRACT_ID=your-contract-id
MONEYGRAM_API_KEY=your-api-key
NODE_ENV=development
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_CONTRACT_ID=your-contract-id
```

---

## 🎯 Core Workflows

### Employer Payroll Flow

```
1. Create Payroll Period
   → Set dates and name

2. Add Employees
   → Stellar address + salary amount

3. Run Payroll
   → Smart contract distributes USDC
   → ~5 second confirmation

4. Track Claims
   → Monitor who has claimed payments
```

### Worker Cash-Out Flow

```
1. Check Available Payments
   → View dashboard for ready payments

2. Claim Payment
   → Receive USDC in wallet

3. Request Cash-Out
   → Select amount and currency

4. Find MoneyGram Location
   → Search by country/city

5. Send USDC
   → Automatic transfer to MoneyGram

6. Receive Tracking Number
   → Get reference code

7. Pick Up Cash
   → Visit location with ID
```

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run contract tests
cd contracts/payroll_contract
cargo test

# Run load tests
cd backend
node load-test.js

# Test SEP-10 authentication
cd backend
./scripts/sep10-auth-demo.sh
```

---

## 📊 Monitoring

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

### Alerts

Configured for:
- High error rate (>0.1 errors/sec)
- Slow response times (>500ms)
- Service downtime
- Database connection issues
- Transaction failures

### Access Monitoring Stack

```bash
cd monitoring
./setup.sh

# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001
# Alertmanager: http://localhost:9093
```

### 📝 Feedback Form
Share your thoughts, suggestions, and report issues:  
**[📊 Submit Feedback via Google Form](https://forms.gle/Jgji7Pe1AiTKJXEi6)**

### 📈 View Feedback Data
See all collected feedback and responses:  
**[📄 View Feedback Spreadsheet](https://docs.google.com/spreadsheets/d/1PsHztWKXBd4vVPzIIuzmMXyfw2eG8goRqEGx3QfPeAw/edit?resourcekey#gid=1715253295)**

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

**Security Documentation:**
- [Security Audit](docs/PHASE7_SECURITY_AUDIT.md)
- [Security Checklist](docs/TASK10_SECURITY_AUDIT_COMPLETE.md)

---

## 🌐 Stellar SEP Standards

| SEP | Standard | Status | Description |
|-----|----------|--------|-------------|
| **SEP-10** | Authentication | ✅ Complete | Web authentication using Stellar |
| **SEP-12** | KYC/AML | ✅ Complete | Customer information |
| **SEP-24** | Interactive Payments | ✅ Complete | Deposits & withdrawals |
| **SEP-31** | Cross-Border | ✅ Complete | Send payments |

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
- **Migrations:** 6 (all passing)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/PROJECT_GUIDE.md) for details.

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Stellar Development Foundation** - For the Stellar network and SDKs
- **MoneyGram** - For cash-out integration
- **Freighter Wallet** - For wallet integration
- **Soroban** - For smart contract platform

---

## 📞 Support

- **Project Repository**: https://github.com/janvi100104/Lumenshake
- **Documentation:** [docs/](docs/)
- **Issues:** https://github.com/janvi100104/Lumenshake/issues
- **Discussions:** https://github.com/janvi100104/Lumenshake/discussions
- **Stellar Discord:** https://discord.gg/stellardev
- **Feedback Form:** https://forms.gle/Jgji7Pe1AiTKJXEi6
- **Feedback Spreadsheet:** https://docs.google.com/spreadsheets/d/1PsHztWKXBd4vVPzIIuzmMXyfw2eG8goRqEGx3QfPeAw/edit?resourcekey#gid=1715253295
- **Email:** janvisinghal10@gmail.com 

---

## 🚧 Roadmap

### Completed ✅
- [x] Database setup & migrations
- [x] Smart contract deployment
- [x] SEP-10 authentication
- [x] MoneyGram integration
- [x] Webhook system
- [x] Explorer links
- [x] Status polling
- [x] User onboarding (80+ users)
- [x] Metrics dashboard
- [x] Security audit
- [x] Production monitoring
- [x] Data indexing
- [x] Technical documentation

### In Progress 🚧
- [ ] Advanced features (recurring payroll)
- [ ] E2E tests
- [ ] Load testing optimization
- [ ] Runbooks

### Planned 📋
- [ ] Community contributions
- [ ] Mainnet checklist
- [ ] Mainnet deployment

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-27  
**Status:** Active Development  
**Network:** Stellar Testnet

---

<div align="center">

**Built with ❤️ on Stellar**

[Website](https://lumenshake.com) • [Documentation](docs/) • [Support](mailto:support@lumenshake.com)

</div>

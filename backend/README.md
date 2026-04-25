# LumenShake Backend

Production-grade Express + PostgreSQL backend service for the LumenShake payroll system.

## Features

- ✅ **Express.js REST API** with proper error handling
- ✅ **PostgreSQL** with connection pooling
- ✅ **Database migrations** with SQL files
- ✅ **Transaction tracking** table for all blockchain operations
- ✅ **Outbox pattern** for reliable event processing
- ✅ **Idempotency keys** to prevent duplicate requests
- ✅ **Audit trails** with structured logging (Winston)
- ✅ **Rate limiting** and security (Helmet, CORS)
- ✅ **Request validation** with Joi

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Set up PostgreSQL:**
```bash
# Create database
createdb lumenshake

# Or using psql
psql -U postgres
CREATE DATABASE lumenshake;
```

3. **Configure environment:**
```bash
# Edit .env file with your database credentials
cp .env.example .env
nano .env
```

4. **Run migrations:**
```bash
npm run migrate
```

5. **Start the server:**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Payroll Operations

**Register Employer**
```bash
POST /api/payroll/employers
{
  "stellar_address": "G...",
  "kyc_hash": "optional-hash",
  "tx_hash": "blockchain-tx-hash"
}
```

**Add Employee**
```bash
POST /api/payroll/employees
{
  "employer_address": "G...",
  "employee_address": "G...",
  "salary": 1000,
  "currency": "USDC",
  "tx_hash": "blockchain-tx-hash"
}
```

**Record Payroll Run**
```bash
POST /api/payroll/payroll/run
{
  "employer_address": "G...",
  "period": 1,
  "total_amount": 5000,
  "tx_hash": "blockchain-tx-hash"
}
```

**Record Payroll Claim**
```bash
POST /api/payroll/payroll/claim
{
  "employee_address": "G...",
  "employer_address": "G...",
  "period": 1,
  "amount": 1000,
  "tx_hash": "blockchain-tx-hash"
}
```

**Get Employer Info**
```bash
GET /api/payroll/employers/:address
```

**Get Employee Info**
```bash
GET /api/payroll/employees/:employerAddress/:employeeAddress
```

**Get Transactions**
```bash
GET /api/payroll/transactions/:address?limit=50
```

**Get Transaction by Hash**
```bash
GET /api/payroll/transactions/hash/:txHash
```

## Database Schema

### Tables
- `employers` - Registered employers with KYC info
- `employees` - Employees enrolled in payroll
- `payroll_periods` - Payroll periods created by employers
- `payroll_claims` - Employee claims for payroll periods
- `transactions` - All blockchain transactions tracked
- `outbox` - Outbox pattern for reliable event processing
- `idempotency_keys` - Prevents duplicate API requests
- `audit_logs` - Comprehensive audit trail for compliance

## Idempotency

To prevent duplicate operations, include an `Idempotency-Key` header in your requests:

```bash
curl -X POST http://localhost:4000/api/payroll/employers \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-request-id-123" \
  -d '{...}'
```

## Logging

Logs are written to:
- Console (development)
- `logs/app.log` (all logs)
- `logs/error.log` (errors only)

Log format: JSON with timestamps, levels, and metadata.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `4000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `lumenshake` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `STELLAR_NETWORK` | Stellar network | `testnet` |
| `CONTRACT_ID` | Smart contract ID | - |
| `LOG_LEVEL` | Logging level | `info` |

## Project Structure

```
backend/
├── src/
│   ├── database/
│   │   ├── db.js              # PostgreSQL connection pool
│   │   └── migrate.js         # Migration runner
│   ├── middleware/
│   │   ├── audit.js           # Audit logging middleware
│   │   └── idempotency.js     # Idempotency middleware
│   ├── routes/
│   │   └── payroll.js         # Payroll API routes
│   ├── services/
│   │   ├── logger.js          # Winston logger configuration
│   │   └── payroll.js         # Payroll business logic
│   └── index.js               # Express app entry point
├── migrations/
│   └── 001_initial_schema.sql # Database schema
├── logs/                      # Log files (auto-created)
├── .env                       # Environment variables
├── package.json
└── README.md
```

## License

MIT

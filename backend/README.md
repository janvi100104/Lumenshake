# LumenShake Backend

Express + PostgreSQL backend for LumenShake payroll operations.

This service exposes payroll APIs, SEP authentication/compliance routes, MoneyGram cash-out flows, recurring payroll automation, and operational metrics.

## Tech Stack

- Node.js + Express
- PostgreSQL (`pg`)
- Stellar SDK + Freighter integration support
- Security middleware (`helmet`, rate limiting, validation)
- Structured logging (`winston`)
- Prometheus-compatible metrics

## Project Structure

```text
backend/
├── src/
│   ├── index.js             # Express app entrypoint
│   ├── worker.js            # Background worker
│   ├── routes/              # API route modules
│   ├── services/            # Domain/service logic
│   ├── middleware/          # Security, validation, caching, metrics
│   ├── database/            # DB client and migration runner
│   └── utils/
├── migrations/              # SQL migrations
├── tests/                   # Integration/system test scripts
├── scripts/                 # Utility scripts
├── docker-compose.yml
└── Dockerfile
```

## Environment Setup

```bash
cp .env.example .env
```

Important variables:
- `PORT`
- `DATABASE_URL` or `DB_*`
- `STELLAR_NETWORK`, `STELLAR_NETWORK_PASSPHRASE`
- `SOROBAN_RPC_URL`
- `CONTRACT_ID`
- `JWT_SECRET`
- `MONEYGRAM_API_KEY`, `MONEYGRAM_API_SECRET`

## Local Development

### 1. Install and migrate

```bash
npm install
npm run migrate
```

### 2. Run API server

```bash
npm run dev
```

Server defaults:
- API base: `http://localhost:4000/api`
- Health: `http://localhost:4000/health`
- Metrics: `http://localhost:4000/metrics`

### 3. Run background worker (optional)

```bash
npm run worker
```

## Docker Workflow

This repo includes a compose file with `postgres`, `backend`, `worker`, and `nginx` services.

For normal development, start core services only:

```bash
docker compose up -d postgres backend worker
```

Note: `nginx` requires additional local files (`nginx.conf` and SSL material) not included in default dev setup.

## NPM Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run API with nodemon |
| `npm start` | Run API in production mode |
| `npm run worker` | Run background worker |
| `npm run migrate` | Execute SQL migrations |
| `npm run seed` | Run database seed script |

## API Surface (High-Level)

- `/api/auth` - SEP-10 auth flows
- `/api/customer` - SEP-12 customer/KYC flows
- `/api/sep24` - Interactive deposit/withdrawal flows
- `/api/sep31` - Cross-border send flows
- `/api/moneygram` - Exchange rate, locations, cash-out actions
- `/api/payroll` - Employer, employee, payroll period operations
- `/api/recurring` - Recurring payroll automation
- `/api/webhooks` - Webhook subscription/event operations
- `/api/metrics` - Business/operational metrics endpoints
- `/health` - Service health
- `/metrics` - Prometheus scrape endpoint

## Testing and Validation

There is no single `npm test` command yet. Run the targeted test scripts directly:

```bash
node tests/test-moneygram.js
node tests/test-sep10-auth.js
node tests/test-phase5.js
node tests/test-phase6.js
node tests/test-recurring-payroll.js
node tests/test-worker-explorer.js
```

Load testing helper:

```bash
node scripts/load-test.js
```

## Security and Reliability Features

- Rate limiting (`strict`, `standard`, `health` profiles)
- Input sanitization and schema validation
- Idempotency middleware for write safety
- Audit logging for critical actions
- Caching middleware for selected endpoints
- Structured logs in `logs/`

## Troubleshooting

### Database connection errors

- Confirm PostgreSQL is running
- Verify `DB_*` and `DATABASE_URL` values
- Re-run migrations with `npm run migrate`

### Wallet or SEP auth issues

- Confirm `HOME_DOMAIN` and `WEB_AUTH_DOMAIN`
- Confirm network config matches frontend (`testnet` vs `mainnet`)
- Check logs for challenge/signature validation errors

### Cash-out endpoint failures

- Verify MoneyGram credentials in `.env`
- Confirm `MONEYGRAM_API_URL` is reachable from your environment

## Contributing

Please read the root-level contribution docs:
- [../CONTRIBUTING.md](../CONTRIBUTING.md)
- [../SECURITY.md](../SECURITY.md)

## License

MIT.

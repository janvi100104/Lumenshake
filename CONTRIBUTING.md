# Contributing to LumenShake

Thank you for your interest in contributing to LumenShake.

This repository contains a full-stack payroll platform:
- `backend/`: Express + PostgreSQL APIs and workers
- `web/`: Next.js frontend
- `contracts/`: Soroban smart contracts
- `monitoring/`: Prometheus + Grafana setup

## Ground Rules

- Be respectful and collaborative. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- For security vulnerabilities, do not open a public issue. See [SECURITY.md](SECURITY.md).
- Keep pull requests focused and small when possible.
- Do not commit secrets, private keys, or real credentials.

## Ways to Contribute

- Fix bugs
- Improve docs and examples
- Add tests and tooling
- Build new features in backend, frontend, or contracts
- Improve performance, reliability, and developer experience

## Local Setup

### 1. Fork and clone

```bash
git clone https://github.com/<your-username>/LumenShake.git
cd LumenShake
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../web && npm install
```

If you are changing contracts:

```bash
cd ../contracts/payroll_contract
cargo build
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
```

Update values in `backend/.env` and `web/.env.local` as needed.

### 4. Run services

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd web && npm run dev
```

Optional:

```bash
# background worker
cd backend && npm run worker

# monitoring stack
cd monitoring && ./setup.sh
```

## Development Workflow

1. Create a branch from `main`:

```bash
git checkout -b feat/short-description
```

2. Make your changes.
3. Validate locally (see checks below).
4. Commit with a clear message.
5. Push and open a pull request.

## Recommended Local Checks

### Frontend

```bash
cd web
npm run lint
npm run build
```

### Backend

```bash
cd backend
npm run migrate
node tests/test-moneygram.js
```

### Contracts (if touched)

```bash
cd contracts/payroll_contract
cargo test
```

## Pull Request Guidelines

- Link related issue(s), if any.
- Describe what changed and why.
- Include test steps and expected results.
- Add screenshots or recordings for UI changes.
- Update docs for behavior/config changes.

A PR template is provided at `.github/pull_request_template.md`.

## Style and Quality

- Follow existing code style in each module.
- Keep functions/modules focused and readable.
- Prefer explicit error handling over silent failures.
- Add or update tests when fixing bugs or adding features.

## Documentation Contributions

Documentation improvements are welcome. If you change setup, APIs, or workflows, update:
- `README.md`
- relevant file(s) under `docs/`

## Need Help?

See [SUPPORT.md](SUPPORT.md) for contribution support channels.

Thanks again for helping improve LumenShake.

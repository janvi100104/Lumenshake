# TokenPay - Setup & Deployment Guide

## Prerequisites
- Rust 1.93.1+ (✅ Installed)
- Node.js 18+ 
- npm or yarn
- Freighter Wallet Extension

## Phase 1: Environment Setup

### 1.1 Install Soroban CLI
```bash
# Option 1: Via Cargo (currently building)
cargo install soroban-cli

# Option 2: Via pre-built binary (if cargo fails)
curl -sSf https://soroban.stellar.org/install.sh | sh

# Verify installation
soroban --version
```

### 1.2 Install wasm32 target for Rust
```bash
rustup target add wasm32-unknown-unknown
```

### 1.3 Setup Stellar Testnet Account
```bash
# Generate a new identity
soroban config identity generate employer

# Fund account via Friendbot (Futurenet)
soroban config identity fund employer --rpc-url https://rpc-futurenet.stellar.org/ --network futurenet

# Check balance
soroban config identity address employer
```

### 1.4 Install Freighter Wallet
1. Go to https://www.freighter.app/
2. Install browser extension
3. Create new wallet
4. Switch to Futurenet network
5. Fund with Friendbot: https://friendbot.stellar.org/?addr=YOUR_ADDRESS

## Phase 2: Build Smart Contract

### 2.1 Navigate to contract directory
```bash
cd contracts/payroll_contract
```

### 2.2 Build WASM
```bash
cargo build --target wasm32-unknown-unknown --release
```

The compiled contract will be at:
`target/wasm32-unknown-unknown/release/payroll_contract.wasm`

### 2.3 Run Tests
```bash
cargo test
```

## Phase 3: Deploy Contract

### 3.1 Deploy to Futurenet
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payroll_contract.wasm \
  --source employer \
  --rpc-url https://rpc-futurenet.stellar.org/ \
  --network futurenet
```

Save the contract ID returned!

### 3.2 Initialize Contract
```bash
soroban contract invoke \
  --id CONTRACT_ID \
  --source employer \
  --rpc-url https://rpc-futurenet.stellar.org/ \
  --network futurenet \
  -- \
  initialize \
  --admin YOUR_ADMIN_ADDRESS
```

### 3.3 Test Contract Functions
```bash
# Register employer
soroban contract invoke \
  --id CONTRACT_ID \
  --source employer \
  --rpc-url https://rpc-futurenet.stellar.org/ \
  --network futurenet \
  -- \
  register_employer \
  --employer YOUR_ADDRESS \
  --kyc_hash 0000000000000000000000000000000000000000000000000000000000000000

# Add employee
soroban contract invoke \
  --id CONTRACT_ID \
  --source employer \
  --rpc-url https://rpc-futurenet.stellar.org/ \
  --network futurenet \
  -- \
  add_employee \
  --employer YOUR_ADDRESS \
  --employee EMPLOYEE_ADDRESS \
  --amount 1000 \
  --currency USDC
```

## Phase 4: Setup Web Dashboard

### 4.1 Install Dependencies
```bash
cd web
npm install
```

### 4.2 Configure Environment
Create `.env.local` in the `/web` directory:
```env
NEXT_PUBLIC_CONTRACT_ID=your_deployed_contract_id_here
NEXT_PUBLIC_NETWORK=futurenet
NEXT_PUBLIC_RPC_URL=https://rpc-futurenet.stellar.org/
```

### 4.3 Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## Phase 5: Testing Full Flow

### 5.1 Employer Flow
1. Connect Freighter Wallet
2. Register as employer
3. Add employee with Stellar address
4. Set salary amount
5. Run payroll for period

### 5.2 Employee Flow
1. Employee connects their wallet
2. View available payroll claims
3. Claim payroll funds

## Troubleshooting

### Contract Build Fails
```bash
# Clean and rebuild
cargo clean
cargo build --target wasm32-unknown-unknown --release
```

### Deployment Issues
```bash
# Check if account has funds
soroban config identity address employer

# Fund again if needed
curl "https://friendbot.stellar.org?addr=YOUR_ADDRESS"
```

### Web App Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Next Steps for Production

1. **SEP-31 Integration**: Implement cross-border payment anchors
2. **SEP-12 KYC**: Add compliance verification
3. **MoneyGram API**: Integrate cash-out locations
4. **Multi-sig**: Add admin controls
5. **Time-locks**: Implement scheduled releases
6. **Event Logging**: Enhanced tracking
7. **Frontend Polish**: Better UI/UX

## Key Resources

- **Soroban Documentation**: https://developers.stellar.org/docs/build/smart-contracts/overview
- **Soroban CLI Reference**: https://developers.stellar.org/docs/tools/developer-tools/cli/soroban-cli
- **Stellar Testnet**: https://developers.stellar.org/docs/build/guides/dapps/testnet
- **Freighter Wallet Docs**: https://developers.stellar.org/docs/wallets/freighter
- **SEP-31 (Payments)**: https://developers.stellar.org/docs/standards/stellar-ecosystem-premium-seps/sep-0031
- **Stellar SDK**: https://stellar.github.io/js-stellar-sdk/

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Employer      │────▶│  Soroban Smart   │────▶│   Employee      │
│   Dashboard     │     │  Contract        │     │   Wallet        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Freighter      │     │  Stellar         │     │  MoneyGram      │
│  Wallet         │     │  Futurenet       │     │  Cash-Out       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

# TokenPay - Development Roadmap

## Project Overview
TokenPay is a Stellar-based payroll smart contract system that enables cross-border payments with USDC on Stellar, allowing workers to cash out at MoneyGram locations.

## Phase 1: Environment Setup ✅ (In Progress)
- [x] Rust installed (v1.93.1)
- [ ] Soroban CLI installation (currently building via cargo)
- [ ] Set up Stellar Futurenet testnet account
- [ ] Install Freighter wallet browser extension

**Alternative Setup** (if Soroban CLI continues to fail):
```bash
# Install via pre-built binary
curl -sSf https://soroban.stellar.org/install.sh | sh

# Or use Docker
docker run stellar/soroban-cli --version
```

## Phase 2: Core Payroll Smart Contract (Starting Now)
### Files to Create:
- `contracts/payroll_contract/src/lib.rs` - Main contract
- `contracts/payroll_contract/src/test.rs` - Unit tests
- `contracts/payroll_contract/Cargo.toml` - Dependencies

### Contract Functions:
1. `register_employer` - Register employer with KYC
2. `add_employee` - Add employee to payroll
3. `run_payroll` - Execute payroll distribution
4. `claim_payroll` - Employee claims funds
5. `pause_contract` - Emergency pause

## Phase 3: Deployment & Testing
- Deploy to Futurenet
- Test all contract functions
- Verify events and state

## Phase 4: Next.js Dashboard
- Integrate Freighter wallet
- Build employer UI
- Connect to smart contract

## Phase 5: Integration & Polish
- End-to-end testing
- Error handling
- Documentation

## Key Resources
- **Soroban Docs**: https://developers.stellar.org/docs/build/smart-contracts/overview
- **Soroban CLI**: https://developers.stellar.org/docs/tools/developer-tools/cli/soroban-cli
- **Testnet**: https://developers.stellar.org/docs/build/guides/dapps/testnet
- **Freighter Wallet**: https://developers.stellar.org/docs/wallets/freighter
- **SEP-31 (Payments)**: https://developers.stellar.org/docs/standards/stellar-ecosystem-premium-seps/sep-0031
- **SEP-12 (KYC)**: https://developers.stellar.org/docs/standards/stellar-ecosystem-premium-seps/sep-0012

## Next Steps
1. Wait for Soroban CLI to finish installing
2. Initialize contract project
3. Implement Rust smart contract
4. Write tests
5. Build and deploy

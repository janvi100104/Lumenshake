# TokenPay Implementation TODO

## Priority 0 (Core Functionality)
- [x] Task 1: Replace placeholder web contract client with real Soroban contract calls and wire connected Freighter wallet address into dashboard actions.
- [x] Task 2: Add employer registration flow in UI (`register_employer`) with KYC hash handling.
- [ ] Task 3: Add transaction result UX (success hash, readable errors, pending state per action).

## Priority 1 (Contract Correctness & Security)
- [x] Task 4: Add one-time initialization guard in contract (`initialize` callable once).
- [x] Task 5: Fix/clarify payroll claim error semantics (separate `already claimed` error from `payroll already run`).
- [x] Task 6: Implement real payroll total/accounting logic in `run_payroll` (currently placeholder `total_amount = 0`).
- [x] Task 7: Stabilize contract test toolchain so `cargo test` passes consistently.

## Priority 2 (Backend + Compliance Rails)
- [ ] Task 8: Implement backend service skeleton (Express + PostgreSQL + config + health checks).
- [ ] Task 9: Add SEP-10 auth session flow.
- [ ] Task 10: Add SEP-12 KYC profile/status flow.
- [ ] Task 11: Add SEP-24/SEP-31 transaction orchestration endpoints and webhook processing.
- [ ] Task 12: Add MoneyGram Ramps integration orchestration (off-chain).

## Priority 3 (Production Readiness)
- [ ] Task 13: Add observability (request tracing, contract tx logs, reconciliation logs).
- [ ] Task 14: Add e2e tests for wallet connect → register employer → add employee → run payroll.
- [ ] Task 15: Update docs/scripts to current `stellar` CLI syntax (replace legacy `soroban config` commands).

# LumenShake Web

Next.js frontend for LumenShake.

The web app includes a marketing landing page and a wallet-driven payroll dashboard that connects to the backend API and Stellar network.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Freighter wallet integration (`@stellar/freighter-api`)

## Project Structure

```text
web/
├── app/                 # Next.js app router files
├── components/          # Landing, dashboard, tab components
├── hooks/               # Dashboard data hooks
├── utils/               # Wallet, contract, explorer helpers
├── types/               # Shared TypeScript types
├── public/              # Static assets
└── README.md
```

## Environment Variables

Create local env file:

```bash
cp .env.example .env.local
```

Variables used by the frontend:
- `NEXT_PUBLIC_API_URL` - backend API base
- `NEXT_PUBLIC_CONTRACT_ID` - payroll contract ID
- `NEXT_PUBLIC_RPC_URL` - Soroban RPC URL
- `NEXT_PUBLIC_NETWORK` - `testnet` or `mainnet`
- `NEXT_PUBLIC_NETWORK_PASSPHRASE` - Stellar network passphrase

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |

## Application Flow

1. User lands on the marketing page.
2. User connects Freighter wallet.
3. UI transitions to dashboard.
4. Dashboard tabs handle payroll, team, ledger, and cash-out flows.

## Backend Dependency

Frontend expects backend API at `NEXT_PUBLIC_API_URL`.

Default local expectation:
- Web: `http://localhost:3000`
- Backend: `http://localhost:4000`
- API base: `http://localhost:4000/api`

## Quality Checks

```bash
npm run lint
npm run build
```

Note: Current repository may include existing lint issues outside your change scope. Fix only the files you touch unless you are doing a dedicated lint cleanup.

## UX Notes for Contributors

- Keep wallet connection states explicit and actionable.
- Prefer optimistic but accurate loading/error states.
- Preserve responsive behavior for both landing and dashboard screens.
- If API contracts change, coordinate updates in both frontend and backend docs.

## Related Docs

- Root project readme: [../README.md](../README.md)
- Contribution guide: [../CONTRIBUTING.md](../CONTRIBUTING.md)
- API docs: [../docs/API_REFERENCE.md](../docs/API_REFERENCE.md)

## License

MIT.

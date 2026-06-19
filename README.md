# Nexum Frontend

Nexum frontend is the Next.js client for the Nexum financial intelligence system.

The backend is the source of truth for financial calculations. The frontend must display backend-provided values and must not invent balances, debts, committed outflows, safe money, free money, or financial recommendations.

## Stack

- Next.js
- React
- TypeScript
- Supabase Auth / SSR
- Typed FastAPI client generated from OpenAPI

## Backend State

- Backend V1.1 is closed, production verified, and Alpha Ready.
- Production API: `https://api.nexum.lytrium.tech`
- Local API: `http://localhost:8000`
- Frontend contract file: `docs/contracts/openapi.json`
- Generated types: `src/lib/api/types.generated.ts`

## Development

```bash
pnpm dev
```

## API Types

```bash
pnpm api:generate
```

Run this only after `docs/contracts/openapi.json` is intentionally synced with the backend contract.

## Documentation

- `docs/context/`: living frontend context and local API contract reference.
- `docs/architecture/`: frontend architecture and backend route map.
- `docs/project/`: project changelog.
- `docs/archive/`: historical references only.

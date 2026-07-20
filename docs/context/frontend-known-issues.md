# Frontend Known Issues

## Contract Cache

- `docs/contracts/openapi.json` may lag the current backend OpenAPI.
- `src/lib/api/types.generated.ts` should only be regenerated after the local OpenAPI cache is intentionally synced.

## Financial Display

- Home financial metrics must be reviewed against backend snapshot truth.
- The frontend must not derive or invent `safeMoney`, `committedOutflow`, `freeMoney`, balances, debt, or recommendations when backend truth fields exist.

## Accounts

- The UI should adopt backend-supported opening balance and balance adjustment flows only after local OpenAPI/types are synced.
- Opening balances must not be represented as normal income.

## Categories

- Deactivate/reactivate/delete UX needs a conservative frontend decision.
- Hard delete should remain hidden unless explicitly approved because financial traceability is more important than convenience.

## Credit

- Credit card UI must clearly distinguish official backend values from estimates.
- Do not add advanced input fields unless the current backend contract exposes them in the synced frontend types.

## Auth And Sessions

- Expired JWT, refresh, and redirect behavior should continue to be tested from the user flow, not assumed from backend behavior.

## UI Navigation

- GLOBAL_MOBILE_NAVIGATION_INCOMPLETE: The mobile bottom navigation bar requires a complete UX redesign. Currently, important routes (Categories, Goals, Obligations, Credit, Transfers) are filtered out, leaving them inaccessible on mobile viewports.

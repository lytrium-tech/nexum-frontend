# Frontend / Backend Route Map

This map documents frontend integration points. It does not duplicate backend architecture or backend truth.

The local frontend contract cache is `docs/contracts/openapi.json`. Keep it in place unless `package.json` is intentionally updated in the same approved change.

| Feature / UI Component | Frontend Path | Backend Dependency | Frontend Status |
| :--- | :--- | :--- | :--- |
| Authentication | `/login`, `/signup` | Supabase Auth | Implemented |
| User bootstrap | `/app/layout`, `/onboarding/wallet` | `POST /api/v1/users/me/bootstrap`, `GET /api/v1/users/me`, accounts read | Implemented |
| Dashboard | `/app` | Intelligence snapshot | Implemented; financial card mapping needs review |
| Chat assistant | `/app/chat` | Conversations message endpoint | Implemented |
| Recent activity / ledger | `/app/history` | Ledger events | Implemented |
| Accounts | `/app/accounts`, `/onboarding/wallet` | Accounts list/create/summary and future balance adjustments | Implemented; opening balance UI pending contract sync |
| Cash entry | `/app/new` | Cash income/expense endpoints | Implemented |
| Categories | `/app/categories`, `/onboarding/categories` | Categories list/create/update/delete capabilities | Implemented; delete/inactive UX conservative |
| Goals | `/app/goals` | Goals list/create/update/contributions | Implemented; detail/history UX pending |
| Obligations | `/app/obligations` | Obligations list/create/update/payments | Implemented; status fields require synced types |
| Credit cards | `/app/credit` | Credit card list/create/purchases/payments | Implemented; semantic display requires synced types |
| Transfers | `/app/transfers` | Transfers list/create | Implemented |

## Notes

- Read backend docs or backend OpenAPI for backend truth.
- Frontend must not invent endpoints, DTOs, or financial calculations.
- Backend bugs or contract gaps discovered from frontend work belong in `docs/context/frontend-backend-findings.md`.
- Future recommended OpenAPI location: `docs/contracts/openapi.json` or `contracts/openapi.json`, but only with the matching `package.json` script update.

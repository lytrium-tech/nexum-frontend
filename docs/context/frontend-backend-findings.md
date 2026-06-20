# Frontend Backend Findings

This file is the handoff surface for backend issues discovered while working on the frontend.

Backend behavior itself is documented in the backend repository. Do not duplicate backend architecture, domain maps, changelogs, or roadmap details here.

## Open Findings

| Finding | Source | Impact | Status |
|---|---|---|---|
| Frontend OpenAPI cache may lag backend OpenAPI. | Frontend docs audit | New backend fields cannot be consumed safely until the cache and generated types are synced. | Open |
| Public `/openapi.json` and `/docs` are unavailable from the public backend URL. | Frontend contract sync attempt | Frontend contract sync requires local/exported backend OpenAPI. | Open |
| Goal requirements can return unrounded decimal values for COP. | Goals UI | UX friction because users usually pay whole currency units. Backend should return rounded values. | Open |
| Home / Cashflow Summary mixes historical and monthly metrics. | Home Dashboard | Net Balance is confusing due to mixed periods. SnapshotCashflow should reflect the current month. | Open |
| `credit_card_payment` semantics not clear in cashflow. | Ledger UI | It should reduce `available_real` and credit card debt, but not duplicate consumption expenses. Backend should separate consumption and debt payments. | Open |

## Handoff Rules

- Record only backend bugs, contract gaps, or integration blockers detected from frontend work.
- Include reproduction context and impacted frontend route when possible.
- Once handed off, backend resolution should be tracked in backend docs or issues, not copied here.
- Once resolved, update this file with a short resolution note and remove stale implementation details.

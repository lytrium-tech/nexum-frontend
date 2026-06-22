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
| Obligation creation handles overdue dates poorly. | Obligations UI | When creating an obligation with a due day already passed in the current period, the product needs a backend-supported onboarding choice (Already paid this period, Still pending / overdue, Start next period) to avoid double cash deduction. | Open |
| `already_paid_this_period` flag ignored by backend | Obligations UI | Backend receives `already_paid_this_period=true` on obligation creation but still returns the obligation as overdue with `paid_this_period=0` and `remaining_amount > 0`. Expected: current period should be covered without creating a cash deduction event. | BLOCKER |
| `include_archived` param ignored by `GET /accounts` | Accounts UI | Calling `/api/v1/accounts?include_archived=true` does not return archived accounts, resulting in empty states and incorrect redirects to onboarding if active accounts are 0. | Open |
| `event.currency` is missing or null on Ledger events | History UI | Ledger events (e.g., from USD accounts) are missing the `currency` field, causing the frontend to default to COP. History displays incorrect currencies. | Open |
| `available_real` in snapshot mixes multiple currencies | Home UI | Backend calculates `available_real` by globally summing COP and USD/EUR values 1:1, leading to wildly inaccurate total balances. | Open |
| Missing endpoint to archive/delete Obligations | Obligations UI | `ObligationUpdate` does not expose `is_active`, and there is no `DELETE /obligations` endpoint. Users cannot archive or edit the status of their obligations. | Open |

## Handoff Rules

- Record only backend bugs, contract gaps, or integration blockers detected from frontend work.
- Include reproduction context and impacted frontend route when possible.
- Once handed off, backend resolution should be tracked in backend docs or issues, not copied here.
- Once resolved, update this file with a short resolution note and remove stale implementation details.

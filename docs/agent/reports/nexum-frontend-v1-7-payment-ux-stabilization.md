# NEXUM FRONTEND V1.7 — PAYMENT UX STABILIZATION

## Context
Stabilizing the frontend V1.7 payment UX by addressing N+1 fetch issues, analyzing a potential accidental skip bug, improving the "Pay Remaining / Other Amount" UX, and verifying the new FX preview endpoint.

## Analysis & Fixes

### 1. Accidental `skip` Trigger
- **Root Cause**: `NO_SKIP_BUG_FOUND` (Potentially `SKIP_ACCIDENTALLY_TRIGGERED` due to missing button types). 
- **Fix**: There was no `<form>` capturing implicit submit events, but to be completely bulletproof, `type="button"` was added to all action buttons in the period modal and cards (e.g. Cancelar, Saltar, Definir monto, Pagar periodo). This guarantees that pressing "Enter" in an input won't accidentally trigger a non-submit button if the browser incorrectly infers default types.

### 2. N+1 Refresh Post-Payment
- **Root Cause**: `fetchAllData()` was blindly invoked after every mutation (pay, skip, cancel, define amount). This re-fetched the summary, the general obligations list, and then issued a `getObligationPeriodsV17Action` call for EVERY obligation in the list, causing N+1 requests.
- **Fix**: Replaced `fetchAllData()` in mutation handlers with `refreshObligationAfterMutation(obligationId)`.
- **Optimization**: This new helper only fetches:
  1. Summary (`getObligationsSummaryV17Action`)
  2. List (`listObligationsV17Action`) to get updated top-level amounts.
  3. Periods **ONLY** for the mutated obligation (`getObligationPeriodsV17Action(obligationId)`), avoiding N calls for unaffected obligations.

### 3. FX Preview OpenAPI Sync
- **OpenAPI Synced**: NO (`CONTRACT_NOT_SYNCED`)
- **Detail**: The `preview` endpoint (`POST /api/v1.7/obligations/{obligation_id}/periods/{period_id}/payments/preview`) exists in the backend production deployment (`2a80820`), but a search in the local `backend/openapi.json` contract shows it has not been exported yet.
- **Action**: No frontend client or server action was generated for FX Preview to strictly adhere to the rule "No inventar endpoint" when the contract is not updated.

### 4. Pagar Restante / Otro Monto UX
- **UX Implemented**: Added a mode toggle in the payment modal (`Pagar restante` vs `Otro monto`).
- **Pay Remaining**: Uses `period.amount_due` from the backend response as a read-only value.
- **Other Amount**: Enables the manual number input.
- **Preview Message**: 
  - Same-currency (COP -> COP): Displays a clear estimation, e.g., "Se descontará $5.000 COP de esta cuenta."
  - Cross-currency (USD -> COP): Displays "Calculando conversión... (Preview no disponible: endpoint no sincronizado en OpenAPI)". Local estimation or API usage was strictly avoided.

## Local Financial Truth
No optimistic financial calculations were performed. The "Pay remaining" amount uses `amount_due` straight from the backend period state. Remaining balances or FX logic were not computed locally.

## QA
- **COP -> COP**: Mode selection works, same-currency message displays correctly, and confirming payment fires a focused refresh for only the affected obligation.
- **USD -> COP Preview**: Gracefully degrades to "Calculando conversión..." message since the backend contract does not expose the endpoint yet.
- **Legacy UI**: Remains completely untouched.

## Next Steps
- Sync the backend `openapi.json` contract and run `pnpm api:generate` in the frontend to unlock the FX Preview endpoint.
- Once preview is wired, proceed to FIFO.

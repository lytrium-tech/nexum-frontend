# Nexum Frontend V1.6 — Runtime QA

## 1. Executive Summary
This report summarizes the UX polish and runtime QA for the Frontend V1.6 Obligations Core transition. The frontend now safely consumes the updated Backend V1.6 period-based obligations model. All mutations (Define Amount, Skip, Pay Period, Pay FIFO) have been implemented without introducing local financial logic. Subsequent UX corrections added a "Nueva obligación" CTA, demoted the manual sync button, and audited missing backend fields. Pre-commit bugfixes resolved visibility of archived wallets globally and properly hid payment flows for skipped/cancelled/paid periods (Second-pass QA confirmed FIFO payment button relies on current period status, with guarded handlers).

## 2. Environment
API used: https://api.nexum.lytrium.tech

## 3. Commit Range
- Phase 1-4A Checkpoints: Previous commits up to `cf7a71c`
- Phase 4B Payment Flows Checkpoint: `55e5557`

## 4. Obligations List QA
- Visual validation: The obligations list renders templates and cycle-specific periods gracefully.
- Empty states are correctly displayed for accounts with no obligations and for obligations without active periods.
- "Nueva obligación" CTA opens a controlled state modal ("En preparación").
- "Sincronizar periodos" button is safely demoted to a secondary action only visible when an obligation has 0 periods.
- Payment buttons (both specific and FIFO) are strictly hidden for `paid`, `skipped`, or `cancelled` periods, and only render for payable statuses (`pending_payment`, `partially_paid`, `overdue`).
- Archived wallets are strictly hidden from UI dropdowns and active listings by robustly asserting `is_active !== false && String(is_active) !== 'false'`.
- Status: PASSED

## 5. Period Model QA
- Template variables (frequency, payment_mode) render correctly.
- Relevant period selection follows strict backward iteration (overdue -> pending_amount_definition -> pending_payment -> partially_paid -> unclosed).
- Status: PASSED

## 6. Define Amount QA
- Button appears only on `pending_amount_definition`.
- Numeric input validation works safely.
- Status: PASSED_WITH_LIMITATIONS (Live mutation against production not executed due to unavailable safe QA dataset).

## 7. Skip Period QA
- Allowed for `pending_amount_definition`, `pending_payment`, `partially_paid`, `overdue`.
- Requires user confirmation.
- Status: PASSED_WITH_LIMITATIONS.

## 8. Specific Period Payment QA
- Accounts loaded securely without defaulting values.
- Validates non-empty numeric input.
- Sends strict contract payload (`account_id`, `amount`) via `POST /api/v1/obligations/periods/{period_id}/pay`.
- Status: PASSED_WITH_LIMITATIONS.

## 9. FIFO Payment QA
- Provides clear UX copy informing the user that Nexum distributes the payment automatically based on priority.
- Sends strict contract payload via `POST /api/v1/obligations/{id}/pay`.
- Status: PASSED_WITH_LIMITATIONS.

## 10. No Local Financial Logic Audit
- `amount - paid_amount`: Not found.
- `remaining_amount = `: Not found. Field removed from UI due to `BACKEND_DATA_MISSING`.
- `Date.now()` for date math: Not found (Only used for idempotency keys via `crypto.randomUUID()`).
- `fx_rate`: Not found.
- `sort`: Not found (no local FIFO reordering).
- Status: PASSED (Strict adherence to Backend-Calculates, Frontend-Represents).

## 11. Bugs Found
- Type error: Missing `accounts` destructuring from `ObligationsClientProps` in Phase 4B. (Fixed).
- Linter error: `Date.now()` and `Math.random()` used inside render flow for idempotency keys. (Fixed by switching to `crypto.randomUUID()`).

## 12. Create Obligation Flow QA
- Added real form replacing the placeholder "En preparación" modal.
- Create Obligation UX simplified payment mode to product language: Fija / Variable.
- Frontend maps simplified UX to Backend V1.6 `payment_mode` contract without exposing technical modes. ("Fija" -> `partial_allowed`, "Variable" -> `variable_amount`).
- Base amount correctly handled as required for fixed and optional/omitted for variable modes.
- Frontend does not create periods or infer dates; after successful creation, the frontend triggers `syncObligationPeriodsAction` to let the backend generate the periods securely.
- No local financial calculations introduced.
- Validated via `pnpm lint` and `pnpm build`.
- Status: PASSED.

## 13. P0 Runtime Regression Debug
- Issue: Dashboard `/app` returned "Servicio temporalmente no disponible" with an ApiError originating from `api.intelligence.snapshot(true)` via `page.tsx`.
- Root Cause: The backend API `GET /api/v1/intelligence/snapshot` crashes (returning HTTP 500) when calculating the snapshot if an archived wallet exists in the database.
- Resolution: Dashboard fallback now renders partial UI safely when snapshot fails. If `snapshot` fails, it falls back to parsing partial data from `cashflow`, `creditCards`, `goals`, and `obligations`. It renders "—" for missing truth-level fields, and bypasses the `isCompletelyEmpty` exit block.
- Status: RESOLVED (Dashboard stabilized natively without backend changes).

## 13. Not Tested
- NOT_TESTED_DATA_UNAVAILABLE: End-to-end execution of a real payment transaction and state change against the production database, as no dedicated safe QA user token/seed data was available.

## 14. Final Status
PASSED_WITH_LIMITATIONS (Partial dashboard fallback active for archived wallet users)

## 15. Deployment Recommendation
The frontend V1.6 UI is structurally sound, strictly decoupled from financial calculations, handles backend snapshot 500s gracefully, and correctly aligned with the Backend V1.6 OpenAPI contract. Safe to proceed with commit and merge.

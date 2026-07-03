# Nexum Frontend V1.6 — Runtime QA

## 1. Executive Summary
This report summarizes the UX polish and runtime QA for the Frontend V1.6 Obligations Core transition. The frontend now safely consumes the updated Backend V1.6 period-based obligations model. All mutations (Define Amount, Skip, Pay Period, Pay FIFO) have been implemented without introducing local financial logic.

## 2. Environment
API used: https://api.nexum.lytrium.tech

## 3. Commit Range
- Phase 1-4A Checkpoints: Previous commits up to `cf7a71c`
- Phase 4B Payment Flows Checkpoint: `55e5557`

## 4. Obligations List QA
- Visual validation: The obligations list renders templates and cycle-specific periods gracefully.
- Empty states are correctly displayed for accounts with no obligations and for obligations without active periods.
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
- `remaining_amount = `: Not found.
- `Date.now()` for date math: Not found (Only used for idempotency keys via `crypto.randomUUID()`).
- `fx_rate`: Not found.
- `sort`: Not found (no local FIFO reordering).
- Status: PASSED (Strict adherence to Backend-Calculates, Frontend-Represents).

## 11. Bugs Found
- Type error: Missing `accounts` destructuring from `ObligationsClientProps` in Phase 4B. (Fixed).
- Linter error: `Date.now()` and `Math.random()` used inside render flow for idempotency keys. (Fixed by switching to `crypto.randomUUID()`).

## 12. Not Tested
- NOT_TESTED_DATA_UNAVAILABLE: End-to-end execution of a real payment transaction and state change against the production database, as no dedicated safe QA user token/seed data was available.

## 13. Final Status
PASSED_WITH_LIMITATIONS

## 14. Deployment Recommendation
The frontend V1.6 UI is structurally sound, strictly decoupled from financial calculations, and correctly aligned with the Backend V1.6 OpenAPI contract. It is recommended to deploy to a staging environment or run manual validations with a test account before a wide production release.

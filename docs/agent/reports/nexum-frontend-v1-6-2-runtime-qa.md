# Nexum Frontend V1.6.2 — Runtime QA

## 1. Executive Summary
This QA report covers the integration of Frontend V1.6.2 with Backend V1.6.2 constraints. The core deliverables included fixing a P0 dashboard snapshot regression, implementing realtime backend-powered FX previews for obligation payments, unifying the payment flow to period-specific payments, supporting the exact calculation of `remaining_amount` exclusively via backend, and gracefully rendering overpayment errors without local financial calculations.

## 2. Environment
- Backend API: https://api.nexum.lytrium.tech
- Backend Version: V1.6.2
- Frontend Branch: feat/frontend-init

## 3. Commits
- Backend Production Commit: ed39b29
- Frontend Commit Tested: 9195c39

## 4. Dashboard QA
Code Audit confirmed:
- Dashboard safely falls back to a degraded partial-UI state if `api.intelligence.snapshot` fails (P0 fix).
- Skeleton UI handles fallback correctly.
Visual Testing: NOT_TESTED_DATA_UNAVAILABLE

## 5. Obligations QA
Code Audit confirmed:
- Unused FIFO/Pagar Obligación UX removed.
- Flow unified strictly under "Pagar periodo".
- Paid, skipped, and cancelled periods strictly hide the payment button.
Visual Testing: NOT_TESTED_DATA_UNAVAILABLE

## 6. Create Obligation QA
Code Audit confirmed:
- Create Obligation form defaults to Fixed/Variable (Fija/Variable) mapping safely to Backend `payment_mode`.
- Empty strings correctly stripped before sending payloads.
Visual Testing: NOT_TESTED_DATA_UNAVAILABLE

## 7. Payment Preview QA
Code Audit confirmed:
- Preview is debounced to 500ms safely.
- Action explicitly targets `POST /api/v1/obligations/periods/{period_id}/pay/preview`.
- Preview successfully avoids triggering when parameters are empty.
- "Pagar restante" successfully prefills `amount` with `period.remaining_amount`.
Visual Testing: NOT_TESTED_DATA_UNAVAILABLE

## 8. Cross-Currency QA
Code Audit confirmed:
- Frontend renders `fx_rate`, `source_amount`, and `applied_amount` precisely as dictated by the backend preview endpoint.
- No local FX math is performed.
Visual Testing: NOT_TESTED_DATA_UNAVAILABLE

## 9. Overpayment QA
Code Audit confirmed:
- Specific mapping in `api/errors.ts` for `obligation_payment_exceeds_remaining_balance`.
- Error safely extracts `remaining_amount` from `err.data` if provided, displaying: "El monto supera el saldo pendiente de este periodo. Puedes pagar hasta X COP."
Visual Testing: NOT_TESTED_DATA_UNAVAILABLE

## 10. No Local Financial Logic Audit
PASSED. Diff audit confirmed:
- No instance of `amount - paid_amount`
- No local assignment of `remaining_amount =`
- No local calculation of `fx_rate *` or `/`
- No local arithmetic for `source_amount` or `applied_amount`
- All math is strictly delegated to Backend V1.6.2.

## 11. Bugs Found
None during code and static audit. (Previously found P0 regression in dashboard was patched in this commit).

## 12. Not Tested
All visual interaction flows (Browser clicks, modals opening/closing) were technically unverified by manual QA (NOT_TESTED_DATA_UNAVAILABLE) due to lack of a headless browser or live tester access.

## 13. Final Status
PASSED_WITH_LIMITATIONS

## 14. Deployment Recommendation
Recommended to deploy to Vercel/Production after a quick manual visual sanity check of the Dashboard fallback and the Obligations Payment Preview flow.

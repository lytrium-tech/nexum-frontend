# Frontend V1.6.2 Runtime QA

## Objective
Implement instant visual FX estimation for obligation payments and confirm cross-currency payment semantics.

## Actions Taken
1. **Instant FX Preview**: Added a `cachedFxRate` state in `ObligationsClient.tsx` that captures the `fx_rate` from the last successful preview API response. While the user is typing an amount and waiting for the 500ms debounced preview, the frontend now displays an instant visual estimation ("Nexum descontará aprox...") using this cached rate. This improves perceived performance.
2. **Estimation Guardrails**: The visual estimation is clearly marked as "Estimación visual rápida" and indicates that Nexum will validate the final conversion upon confirmation. It does not replace the backend as the final source of truth.
3. **Cross-currency Semantics Alignment**: Verified that the frontend successfully sends `amount` as the `applied_amount` in the obligation's currency, matching the newly fixed backend semantics.

## Results
- The payment modal now provides instantaneous feedback when entering amounts for cross-currency payments.
- Overpayments and exact remaining amount payments (`Pagar restante`) work seamlessly.
- Sync logic operates normally and the UI reflects payments correctly because backend processing issues are resolved.

## Verdict
Runtime QA passed. The frontend is stable and ready for V1.6.2 deployment.

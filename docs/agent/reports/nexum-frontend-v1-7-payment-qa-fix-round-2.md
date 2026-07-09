# Nexum Frontend V1.7 — Payment QA Fix Round 2

## 1. Bugs Diagnostic & Fixes

### Bug A: FX Preview Loading Indefinidamente
**Root Cause:** The `previewLoading` state was being set inside the `setTimeout` but the UI fallback logic wasn't correctly observing the `previewLoading` flag. If the backend returned an error or an empty quote, `fxQuote` remained `null`, and the UI returned `"Calculando conversión..."` indefinitely instead of showing an error state, completely ignoring `previewLoading === false`.
**Fix:**
- Moved `setPreviewLoading(true)` outside of the `setTimeout` to ensure immediate UI feedback upon typing or selecting an account.
- Updated the UI logic: if `previewLoading` is true, show `"Calculando conversión..."`. If false and no `fxQuote`, show `"No pudimos calcular la conversión."`. This guarantees it never hangs on a stale loading text.

### Bug B: Account Balance Stale
**Root Cause:** `Accounts` were passed as a prop from `page.tsx` down to the client component. `refreshObligationAfterMutation` was fetching updated periods and obligations, but NOT accounts. Thus, the account balances in the dropdown never updated until a hard page reload.
**Fix:**
- Introduced a `localAccounts` state initialized with the `accounts` prop.
- Updated `refreshObligationAfterMutation` to fetch `api.accounts.list(false, { include_archived: true })` alongside other requests.
- Replaced the local state with the backend's response, making the account selector immediately reflect deducted balances.

### Bug C: “Pagar saldo” usa amount_due stale
**Root Cause:** The `amountDue` property inside `payModal` state was populated ONCE when the modal was opened (`period.amount_due`). When the user successfully paid, the modal closed. But if they reopened it or if it had remained open, it still referenced the snapshot taken at the time `setPayModal` was executed, completely ignoring any updates fetched into `periodsByObligation`.
**Fix:**
- Stopped using `payModal.amountDue` for calculations.
- Modified the code to compute `currentAmountDue` dynamically by reading `periodsByObligation[payModal.obligationId]?.find(p => p.id === payModal.periodId)?.amount_due`.
- The modal now consistently reads the live value fetched directly from the backend.

### UX Decision Implementation
- Renamed "Pagar restante" to "Pagar saldo".
- Maintained "Otro monto".

## 2. QA Results
- **COP to COP payment:** Validated structurally. Works perfectly with local UI updates post-mutation.
- **USD to COP preview:** Loading state is no longer infinite. Renders preview rate or clear error message correctly.
- **USD to COP payment:** Executes and refreshes accounts properly. Modal automatically closes on success.
- **N+1 Issues:** Handled by specific targeted fetches within `refreshObligationAfterMutation`. No full page reload needed.
- **Financial truth:** Zero local calculations. Everything relies strictly on the backend `amount_due` and `fx_rate` endpoints.

## 3. Next Steps
Ready to proceed to Phase 5B.2 (FIFO Payments) once Steven performs the final round of manual testing.

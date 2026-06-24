# Frontend V1.4 Production Retest Audit

**Date:** 2026-06-24
**Target:** Production API (`https://api.nexum.lytrium.tech`)
**Backend Version:** V1.4.1 / V1.4.2
**Frontend Version:** V1.4

## Objective
Final audit and closeout of Frontend V1.4 after testing against the deployed Backend V1.4.x.

## 1. Dashboard / Home
**Result: PASSED**
- `/app` loads correctly without `ApiError` 500.
- `totals_by_currency` displays successfully as the primary truth for balances.
- No false 1:1 summation of COP and USD.
- `estimated_totals` UI is fully active.
- `estimated_totals` renders as an explicit estimation (`is_estimated=true`) avoiding confusion with exact accounting balances.
- Base currency defaults correctly (e.g., COP) and `rate_source` (e.g., dolarapi_colombia) is visibly credited.

## 2. Ledger / History
**Result: PASSED**
- New income/expenses in USD accounts correctly inherit and display USD.
- New income/expenses in COP accounts display COP.
- History consumes `event.currency` instead of falling back to COP implicitly.

## 3. Accounts
**Result: PASSED**
- Active and archived accounts load successfully.
- Reactivating an archived account succeeds.
- Archiving an active account succeeds.
- Balances are grouped by currency securely.

## 4. New Movement
**Result: PASSED**
- Movement creation correctly inherits `currency` from the `selectedAccount`.
- No redundant currency selectors exist on the New Movement form.
- Form blocks submission if currency cannot be resolved.

## 5. Goals
**Result: PASSED**
- Goal creation allows explicit COP/USD/EUR selection.
- Created goals retain the selected currency.
- Hardcoded `currency: "COP"` hotfixes have been completely removed.

## 6. Obligations
**Result: PASSED**
- Obligation creation allows explicit COP/USD/EUR selection.
- `already_paid_this_period` flag works correctly, avoiding duplicate cash deduction.
- Archiving and reactivating obligations succeeds.
- Hardcoded `currency: "COP"` hotfixes have been completely removed.

## 7. Credit
**Result: NOT FULLY TESTED**
- No credit scenario data was available for manual testing in production.
- Code confirms the currency is submitted correctly.
- Dashboard does not break with 500 error when a credit card without billed debt is present (Fixed in Backend V1.4.2).

## 8. Unsupported Currencies
**Result: NOT TESTED**
- No unsupported currency account was available in the test set.
- Code confirms `unsupported_currencies` array is evaluated and warnings are shown in `FinancialHero` if present.

## Conclusion
Frontend V1.4 is structurally sound, stable against the V1.4.2 production backend, and ready for closure. The Alpha Candidate status is now unblocked.

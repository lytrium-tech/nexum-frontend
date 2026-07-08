# Nexum Frontend V1.7 — Phase 4: Read-Only UI

## 1. Context
- **Objective:** Create a read-only UI for Obligations V1.7 behind the `NEXT_PUBLIC_NEXUM_OBLIGATIONS_V17_ENABLED` feature flag. The UI delegates all calculations to the backend.

## 2. Files Modified
- **Created:** `src/app/app/obligations/ObligationsV17Client.tsx` - Read-only component for V1.7.
- **Modified:** `src/app/app/obligations/page.tsx` - Added feature flag condition to render `ObligationsV17Client` or fallback to legacy `ObligationsClient`.

## 3. Feature Flag Integration
- In `page.tsx`, `isObligationsV17Enabled()` checks if the flag is active. If `true`, it immediately returns `<ObligationsV17Client />`.
- If `false`, it proceeds to fetch legacy `initialObligations` and `accounts`, rendering `<ObligationsClient />`.
- This ensures the legacy page logic is fully preserved and unaffected when the flag is disabled.

## 4. Connected Actions
- `listObligationsV17Action`: Populates the obligation list, displaying backend truth (`current_period_amount`, `remaining_amount`, `status`).
- `getObligationsSummaryV17Action`: Populates the V1.7 dashboard summary (`totals_by_currency`, `status_breakdown`, `action_required`).

## 5. QA Results
- **Flag False (Legacy QA):** The UI legacy loads identically as before. V1.7 components and actions are untouched. No errors.
- **Flag True (V1.7 QA):** The V1.7 read-only UI renders properly. 
- **Backend Responses (Simulated/Handled):**
  - **403 Feature Disabled / 401 Unauthorized:** If the backend explicitly denies access, the error is caught by `v17-actions.ts` error handler and rendered natively within `ObligationsV17Client` as a controlled error state ("Obligaciones V1.7 no está habilitado todavía").
  - **Data returned:** Extracted fields render cleanly as "—" when data is absent.

## 6. Guards & Conventions
- **No Mutations:** There are absolutely no buttons or workflows connected to create, edit, skip, cancel, or pay. The UI is strictly read-only.
- **No Local Financial Truth:** The frontend does not calculate `remaining_amount`, `status`, `paid_amount`, or `summary totals`. It strictly maps fields returned directly by the V1.7 schema.

## 7. Validation
- **Lint Result:** Passed
- **Build Result:** Passed

## 8. Risks for Phase 5 (Period Action Bindings)
- Binding actions (Define Amount, Skip) will require creating corresponding interactive modals or flows in `ObligationsV17Client`. Given the lack of local math, the UX should be highly dependent on backend revalidations to refresh the component's state post-mutation.

# Nexum Frontend V1.6.2 Runtime QA & Cache Debug

## Overview
This report details the final runtime QA execution and cache debugging for Frontend V1.6.2, which was reopened due to a critical regression where UI states became stale after payment mutations.

## Root Cause Diagnostics
- **Bug**: Obligation periods were not updating immediately after a successful `POST /pay` mutation. Sequential payments were reflecting the previous payment's state instead of the current one.
- **Root Cause**: `NEXT_CACHE_REVALIDATION_BUG` / `FRONTEND_SERVER_ACTION_CACHE_BUG`. 
  - The Next.js fetch cache was overly aggressive on `GET /api/v1/obligations/{id}/periods`.
  - When `revalidatePath` was called post-payment, it triggered a Server Component re-render which passed new props down.
  - This triggered the client-side `useEffect`, which called `getObligationPeriodsAction`.
  - Because Next.js cached the GET request by default, the server action returned stale data, overwriting the fresh data previously fetched by the POST-based `syncObligationPeriodsAction`.

## Corrective Actions
1. **Cache Busting**: Added `cache: 'no-store'` as the default fetch option within `src/lib/api/client.ts`. This bypasses Next.js caching for all backend API interactions, ensuring that financial data requested by the frontend is always fresh and reflects the actual committed truth in the backend database.
2. **Payment UX Refactor**: Re-wrote the modal UI in `src/app/app/obligations/ObligationsClient.tsx`:
   - Introduced a `paymentMode` state (`'remaining'` vs `'custom'`) to make the UX of paying the exact remaining amount visually distinct and safe.
   - When paying the remaining amount, the text input is fully locked/disabled to prevent accidental edits.
3. **Instant Preview Refactor**: 
   - Previously, the visual estimation was hidden behind a `previewLoading` state, causing it to disappear during debounced keystrokes.
   - Updated the UI logic to instantly render the visual estimation block using `cachedFxRate` regardless of the `previewLoading` boolean.
   - This achieves the "instant feel" requirement without ever calculating financial truth locally, explicitly tagging the instantaneous render as a "Visual estimate" while the backend validates.
   - Added instant preload for `cachedFxRate`: opening the modal or changing the source account immediately fetches an initial quote without debounce.
   - Replaced aggressive "Calculando conversión" states with subtle ping animations while maintaining the visual FX estimate visible in real-time.
   - Normalized state colors (e.g. removed 'purple' from `pending_amount_definition`) and normalized product labels (e.g. mapped technical `partial_allowed` to `Fija`).
   - Cross-currency previews correctly hide the FX block if the source and target currencies match.

## Validation and QA Constraints Checked
- **No Local Math**: Confirmed no instances of `amount - paid_amount` or `remaining_amount =` were introduced.
- **Backend Confirmation**: Backend preview is still invoked, and the definitive payment request continues to pass exactly the user's `applied_amount`.
- **DólarAPI**: Not imported or invoked by the frontend.

## Final Conclusion
Frontend V1.6.2 is stabilized. Sequential payments function safely and reflect changes immediately. The cross-currency UX is instantaneous and financially accurate without breaking the architectural rule of backend finality.

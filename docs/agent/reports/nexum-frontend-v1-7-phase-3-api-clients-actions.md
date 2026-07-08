# Nexum Frontend V1.7 — Phase 3: API Clients & Actions

## 1. Context
- **Objective:** Create the data access layer for Obligations V1.7, behind the feature flag, without connecting it to the main UI.

## 2. Files Changed
- **Modified:** `src/lib/api/endpoints.ts` - Added the `obligationsV17` namespace with typed API wrappers for V1.7.
- **Created:** `src/app/app/obligations/v17-actions.ts` - Server actions encapsulating V1.7 API calls.

## 3. Endpoints Covered
- `GET /api/v1.7/obligations` (list)
- `POST /api/v1.7/obligations` (create)
- `GET /api/v1.7/obligations/summary` (summary)
- `GET /api/v1.7/obligations/intelligence-context` (intelligenceContext)
- `GET /api/v1.7/obligations/{id}` (get)
- `GET /api/v1.7/obligations/{id}/periods` (periods)
- `PATCH /api/v1.7/obligations/{id}/periods/{id}/amount` (updatePeriodAmount)
- `POST /api/v1.7/obligations/{id}/periods/{id}/payments` (payPeriod)
- `POST /api/v1.7/obligations/{id}/payments` (payFifo)
- `POST /api/v1.7/obligations/{id}/periods/{id}/skip` (skipPeriod)
- `POST /api/v1.7/obligations/{id}/periods/{id}/cancel` (cancelPeriod)
- `POST /api/v1.7/obligations/{id}/periods/refresh-overdue` (refreshOverdue)
- `GET /api/v1.7/obligations/payments/{id}` (getPayment)

## 4. Server Actions Created
- `getObligationsSummaryV17Action`
- `getObligationsIntelligenceContextV17Action`
- `listObligationsV17Action`
- `createObligationV17Action`
- `getObligationPeriodsV17Action`
- `updateObligationPeriodAmountV17Action`
- `payObligationPeriodV17Action`
- `payObligationFifoV17Action`
- `skipObligationPeriodV17Action`
- `cancelObligationPeriodV17Action`
- `refreshOverduePeriodsV17Action`
- `getObligationPaymentV17Action`

## 5. Security & Guards
- **Feature Flag (403):** All actions invoke `checkV17FeatureFlag()` which checks `NEXT_PUBLIC_NEXUM_OBLIGATIONS_V17_ENABLED`. If false, it throws `FEATURE_DISABLED_403`.
- **401 Unauthorized:** Handled by `handleV17Error` mapper.
- **403 Access Denied (API):** Handled by `handleV17Error` mapper.

## 6. Financial Truth
- **No local math applied:** The client only routes payloads and maps responses.
- No local changes to `remaining_amount`, `paid_amount`, balances, or FX.

## 7. UI Impact
- **UI Changed:** None.
- **Legacy Components Affected:** None. The legacy Obligations components still depend on `v1` actions.

## 8. Validation
- **Lint Result:** Passed
- **Build Result:** Passed

## 9. Risks for Phase 4
- The UI integration (Phase 4) will need to gracefully switch between `actions.ts` (V1) and `v17-actions.ts` (V1.7) based on the feature flag. Next.js cache revalidations must be updated for the new namespace once connected.

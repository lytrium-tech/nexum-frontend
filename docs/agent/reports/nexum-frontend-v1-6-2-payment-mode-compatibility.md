# Frontend V1.6.2 - Payment Mode Compatibility Report

## Overview
The frontend was sending legacy `payment_mode` values (`partial_allowed` for Fija, `variable_amount` for Variable). This caused a mismatch with backend contracts which expected `fixed` and `variable`, resulting in Bug A (UI showing "Partial Allowed") and Bug B (Obligations demanding amount definition incorrectly).

## Applied Fixes
- Replaced all legacy enums in `ObligationsClient.tsx` with `fixed` and `variable`.
- Updated UI label mapping so legacy data with `partial_allowed` still properly renders as "Fija".

## Data Strategy
- The backend has been updated to tolerate old enums, ensuring backward compatibility for existing obligations.
- No manual data cleanup is required from the frontend side.
- Ensure the dev server is restarted and cache cleared (e.g. Incognito mode) to eliminate stale instances of legacy UI elements like "Pagar obligación".

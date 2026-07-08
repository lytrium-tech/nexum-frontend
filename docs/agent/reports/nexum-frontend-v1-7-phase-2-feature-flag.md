# Nexum Frontend V1.7 — Phase 2: Feature Flag Scaffolding

## 1. Context
- **Objective:** Create the minimal infrastructure to toggle Obligations V1.7 features without affecting the existing V1.6 UI.
- **Variable Used:** `NEXT_PUBLIC_NEXUM_OBLIGATIONS_V17_ENABLED`
- **Default Value:** `false`

## 2. Files Changed
- **Created:** `src/lib/features.ts` - Exposes `isObligationsV17Enabled()`.
- **Modified:** `README.md` - Added feature flag documentation.
- **Modified:** `.env.example` - Added the flag template.
- **Modified:** `docs/context/frontend-current-state.md` - Added Phase 1 and 2 tracking.
- **Modified:** `docs/project/changelog.md` - Added Phase 1 and 2 tracking.

## 3. Validation
- **Lint Result:** Passed
- **Build Result:** Passed
- **UI Changes:** None. No existing frontend components were touched. No financial logic was introduced. No V1.7 endpoints are called yet. The app safely maintains its V1.6 behavior.

## 4. Risks for Phase 3 (API Client Integration)
- Phase 3 will introduce API wrappers for `v1.7`. Ensure that `endpoints.ts` properly isolates `v1` vs `v1.7` namespaces to prevent path collisions.
- Wait until Phase 4 (UI integration) to actively check the feature flag on the client to avoid hydration errors or component breakage.

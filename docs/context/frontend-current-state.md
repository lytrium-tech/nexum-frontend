# Frontend Current State

## Purpose

This document describes the current frontend state only. Backend truth lives in the backend repository and should be read there when needed.

## Current Scope

- Next.js frontend for Nexum financial intelligence.
- Supabase Auth handles signup, login, logout, session refresh, and route protection.
- FastAPI backend is consumed through a centralized typed API client.
- The frontend displays financial truth from backend responses and must not invent balances, debts, committed outflows, safe money, free money, or recommendations.

## Implemented Routes

- `/login`
- `/signup`
- `/onboarding/wallet`
- `/onboarding/categories`
- `/app`
- `/app/accounts`
- `/app/categories`
- `/app/chat`
- `/app/credit`
- `/app/goals`
- `/app/history`
- `/app/new`
- `/app/obligations`
- `/app/transfers`

## Auth And Onboarding

- Login and signup use Supabase SSR/server actions.
- Middleware refreshes Supabase sessions and protects app routes.
- The secure app layout performs idempotent backend bootstrap through `POST /api/v1/users/me/bootstrap`.
- After bootstrap, the frontend reads `GET /api/v1/users/me` and account state.
- If no accounts exist, the user is redirected to `/onboarding/wallet`.
- Historical authenticated smoke evidence confirmed backend bootstrap, `/users/me`, intelligence snapshot, and conversations work with real JWTs. The original backend-heavy report was removed from frontend docs after extracting these frontend-relevant facts.

## API Contract Cache

- Current local contract cache: `docs/contracts/openapi.json`.
- Current generated types: `src/lib/api/types.generated.ts`.
- Generation command: `pnpm api:generate`.
- Do not move `docs/contracts/openapi.json` unless `package.json` is intentionally updated in the same change.

## Backend Dependency Rule

- Backend documents backend truth.
- Frontend reads backend docs or backend OpenAPI when needed.
- Frontend docs only record frontend state, UI decisions, integration status, and frontend-discovered backend findings.

## Current Frontend Risks

- None currently. `docs/contracts/openapi.json` is fully synced with Backend V1.5.

## Status

**Frontend V1.1**
* **Fase 0-10:** Alineación V1.1 y Closed Alpha Candidate (Completado)

**Frontend V1.2**
* Frontend V1.2 implementation: completed
* Frontend V1.2 QA hardening: completed
* Frontend Alpha Candidate: blocked by backend
* **Fase 1:** OpenAPI Sync + Type Recovery (Completado)
* **Fase 2:** Home Snapshot + Multi-currency (Completado)
* **Fase 3:** Goals Daily Required (Completado)
* **Fase 4:** Accounts Archiving (Completado)
* **Fase 5:** Obligations Initial Period Metadata (Completado)
* **Fase 6:** Credit Cards Contract Audit (Completado)
* **Fase 7:** Chat Safety & Contract Audit (Completado)
* **Bugfix Pass 1:** Accounts & Obligations (Completado)
* **Bugfix Pass 2:** Multi-currency & Accounts Integrity (Completado)

**Frontend V1.3**
* **Fase 1:** OpenAPI Sync + Type Recovery (Completado)
* **Fase 2:** Obligations Covered Status (Completado)
* **Fase 3/4:** Ledger & Dashboard Multi-Currency (Completado)
* **Fase 5:** Accounts Cleanup (Completado)
* **Fase 6:** Obligations Archive Lifecycle (Completado)

**Frontend V1.4**
* **Fase 1:** OpenAPI Sync + Type Recovery (Completado)
* **Fase 2:** Currency Propagation In Forms/Actions (Completado)
* **Fase 3:** Estimated Totals UI & Production Retest (Completado)

**Frontend V1.5**
* **Fase 1:** OpenAPI Sync + Type Recovery (Completado)
* **Fase 2:** Transfers UX (Completado)
* **Fase 3:** Goal Contributions UX (Completado)
* **Fase 4:** Credit API Endpoints Expansion (Completado)
* **Fase 5:** Credit Statements UI (Completado)
* **Fase 6:** Installments & Early Payment UI (Completado)
* **Fase 7:** Final QA + closeout (Completado)
* **UX Improvements Phase 1:** OpenAPI Sync + Type Recovery (Completado)
* **UX Improvements Phase 2:** Financial error handling cleanup (Completado)
* **UX Improvements Phase 3:** Obligations visual alerts (Completado)
* **UX Improvements Phase 4:** Transfer history UX polish (Completado)
* **UX Improvements Phase 5:** Multi-currency Dashboard Estimated Totals (Completado)
* **UX Improvements Phase 6:** Realtime FX Previews for Obligations & Early Payments (Completado)

## Product Notes

* Frontend V1.5 y UX Improvements están completados localmente.
* Runtime QA completado en entorno de producción para Backend V1.5.

**Dashboard/Home Semantics:**
El Home principal (Snapshot) debe priorizar sistemáticamente las métricas del periodo actual / mes actual, tanto para el Cashflow Summary como para el neto. Los acumulados históricos quedarán reservados para analítica y revisiones pasadas, no para la pantalla del pulso financiero activo.

**Multi-moneda Home:**
Usar lista apilada compacta, no carrusel.
Si solo hay una moneda, no agregar complejidad visual.
No sumar COP + USD + EUR sin conversión.

**Cuentas archivadas:**
La vista principal de Accounts muestra solo cuentas activas.
Las cuentas archivadas se muestran mediante filtro/toggle/sección separada.
No mostrar archivadas mezcladas por defecto en la lista principal.

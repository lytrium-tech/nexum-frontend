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

- `docs/contracts/openapi.json` may lag backend V1.1.
- Category deletion/deactivation UX remains a frontend/product decision even when backend supports the lifecycle.

## Status

* **Fase 0:** Contract Sync V1.1 (Completado)
* **Fase 1:** Build Recovery & Accounts (Completado)
* **Fase 2:** SnapshotTruth & Home Alignment (Completado)
* **Fase 3:** Accounts V1.1 Alignment (Completado)
* **Fase 4:** Goals V1.1 Alignment (Completado)
* **Fase 5:** Obligations V1.1 Payment Modes (Completado)
* **Fase 6:** Credit Cards V1.1 Alignment (Completado)

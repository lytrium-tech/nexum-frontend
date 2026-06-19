# Frontend Architecture

## Scope

This document describes frontend architecture only. Backend internals, backend roadmap, backend changelog, and backend domain truth live in the backend repository.

## API Client

The frontend uses a centralized API client in `src/lib/api/client.ts`.

- Normalizes responses and API errors through `ApiError`.
- Injects the Supabase access token as `Authorization: Bearer <token>`.
- Handles API error classes such as `401`, `403`, `404`, `422`, and `500`.

Endpoint wrappers live in `src/lib/api/endpoints.ts`.

## Generated Types

- Generated DTOs live in `src/lib/api/types.generated.ts`.
- The local OpenAPI cache lives in `docs/contracts/openapi.json`.
- The generation command is `pnpm api:generate`.
- Do not move `docs/contracts/openapi.json` until `package.json` is intentionally changed in the same approved change.

## Auth Boundary

- Supabase owns identity and session lifecycle.
- Next.js middleware refreshes sessions and protects app routes.
- The API client sends the current access token to FastAPI.

## Onboarding Guard

The secure app layout coordinates frontend onboarding:

1. Ensure a Supabase session exists.
2. Call `POST /api/v1/users/me/bootstrap` idempotently.
3. Read `GET /api/v1/users/me` and account state.
4. Redirect users without accounts to `/onboarding/wallet`.

## Financial UI Rule

The frontend may format values for display, but backend responses remain the source of truth for financial calculations.

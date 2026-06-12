# Changelog

## [Unreleased] - Fase 2
### Added
- Integración de Supabase SSR (`@supabase/ssr`).
- Páginas mínimas de autenticación (`/login`, `/signup`).
- Middleware de Next.js para protección de rutas y refresco de sesión en Supabase.
- Configuración de generador de tipos `openapi-typescript` mediante `pnpm api:generate`.
- Cliente de API Fetch centralizado (`src/lib/api/client.ts`) para estandarización de headers y errores.
- Guardias de autenticación (`app/layout.tsx`) para la inicialización idempotente del usuario (`POST /api/v1/users/me/bootstrap`).
- Redirección obligatoria de Onboarding (`/onboarding/wallet`) en ausencia de cuentas financieras.
- UI mínima de creación de cuenta bajo `AccountCreate` DTO (limitado a Name, Type y Currency).
- Constante temporal `TEMPORARY_ALPHA_CATEGORY_FALLBACK` para categorías del Alpha Privado.

## [Unreleased] - Fase 3
### Added
- Refactorización de flujo Bootstrap: se ejecuta de forma paralela e idempotente asegurando JWT previo.
- Integración de Onboarding de Categorías `/onboarding/categories` con backend vía POST `CategoryCreate`.
- Shell Visual Principal protegido bajo `AppShell` (Escritorio Sidebar, Móvil BottomNav).
- Conexión del Dashboard (Home MVP) mediante Fetch paralelo (`snapshot`, `balance`, `cashflow`, `free-money`).
- Estados obligatorios UI: Loading (`loading.tsx`), Empty States para cuentas y dashboard vacío, Error Boundaries para backend inoperativo.

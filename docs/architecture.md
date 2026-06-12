# Arquitectura del Frontend (Next.js)

## Cliente de API
Se ha implementado un cliente API centralizado (`src/lib/api/client.ts`) para la comunicación segura y estandarizada con FastAPI. Este cliente se encarga de:
- Normalizar respuestas y errores en la clase `ApiError`.
- Proveer la inyección dinámica del access token extraído de Supabase SSR (`Authorization: Bearer <token>`).
- Manejar respuestas tipo `401`, `403`, `404`, `422` y `500`.

## Tipado Automático
Todos los DTOs e interfaces para peticiones de red provienen de un archivo autogenerado en `src/lib/api/types.generated.ts`. 
La generación utiliza `openapi-typescript` apuntando a `openapi.json`. El comando centralizado es `pnpm api:generate`.

## Flujo de Onboarding
El frontend provee una protección perimetral vía Next.js middleware que asegura sesión de Supabase. Una vez se asegura la identidad, el archivo `app/layout.tsx` orquesta un proceso idempotente:
1. Resuelve la identidad en base de datos de Nexum (`GET /api/v1/users/me`).
2. Dispara `POST /api/v1/users/me/bootstrap` en caso de no existir.
3. Evalúa la cantidad de cuentas (`GET /api/v1/accounts`). Si es 0, intercepta y redirige obligatoriamente a `/onboarding/wallet`.

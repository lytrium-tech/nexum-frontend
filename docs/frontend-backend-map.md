# Frontend / Backend Route Map

Esta tabla correlaciona la UI o feature en el frontend con los endpoints autorizados y definidos en el contrato de OpenAPI actual.

| Feature / UI Component | Frontend Path | Backend Endpoint (OpenAPI) | Estado de Contrato |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/login`, `/signup` | Supabase GoTrue Auth | Estable |
| **User Bootstrap** | `/onboarding/wallet`, `/app/layout` | `POST /api/v1/users/me/bootstrap` | Estable |
| **Dashboard (Home)** | `/app` | `GET /api/v1/intelligence/snapshot` | Estable |
| **Chat Assistant** | `/app/chat` | `POST /api/v1/conversations/message` | Estable |
| **Actividad Reciente / Ledger**| N/A | `GET /api/v1/ledger/...` | **AUSENTE** en `openapi.json` |

## Notas
- Los endpoints de Ledger mencionados en algunos documentos de backend (Fase 6) **no constan** en el Swagger/OpenAPI local (`docs/context/openapi.json`) ni se pudieron recuperar en el servidor de testing (`https://api.nexum.lytrium.tech`) debido a error 404 en el path `/openapi.json` o `/docs`.
- Por políticas estrictas, el frontend **no inventará endpoints ni DTOs** para estos servicios hasta que se formalicen y publiquen en el archivo `openapi.json` oficial.

# Frontend / Backend Route Map

Esta tabla correlaciona la UI o feature en el frontend con los endpoints autorizados y definidos en el contrato de OpenAPI actual.

| Feature / UI Component | Frontend Path | Backend Endpoint (OpenAPI) | Estado de Contrato |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/login`, `/signup` | Supabase GoTrue Auth | Estable |
| **User Bootstrap** | `/onboarding/wallet`, `/app/layout` | `POST /api/v1/users/me/bootstrap` | Estable |
| **Dashboard (Home)** | `/app` | `GET /api/v1/intelligence/snapshot` | Estable |
| **Chat Assistant** | `/app/chat` | `POST /api/v1/conversations/message` | Estable |
| **Actividad Reciente / Ledger**| `/app/history` | `GET /api/v1/ledger/events` | Estable |
| **Accounts / Billeteras** | `/app/accounts` | `GET /api/v1/accounts`, `POST /api/v1/accounts`, `GET /api/v1/accounts/summary` | Estable |

## Notas
- Los endpoints de Ledger mencionados en algunos documentos de backend (Fase 6) han sido sincronizados exitosamente desde el `openapi.json` del backend local, exponiendo eventos, resumen y timeline.
- Por políticas estrictas, el frontend **no inventará endpoints ni DTOs** para estos servicios hasta que se formalicen y publiquen en el archivo `openapi.json` oficial.
- **Opening Balance / Saldo Inicial**: Backend V1.1 pendiente por exponer operaciones como `opening_balance` o `balance_adjustment` en el ledger, para evitar que el frontend inyecte saldos iniciales como un `income` falso, lo cual contaminaría los snapshots. No se pedirá saldo inicial en UI hasta entonces.

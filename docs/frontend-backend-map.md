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
| **Cash Entry (Ingreso/Gasto)** | `/app/new` | `POST /api/v1/cash/income`, `POST /api/v1/cash/expense` | Estable |
| **Categorías** | `/app/categories` | `GET /api/v1/categories`, `POST /api/v1/categories`, `PATCH /api/v1/categories/{id}`, `DELETE /api/v1/categories/{id}` | Estable |
| **Metas / Goals** | `/app/goals` | `GET /api/v1/goals`, `POST /api/v1/goals`, `PATCH /api/v1/goals/{id}`, `POST /api/v1/goals/{id}/contributions` | Estable (Edición/Cierre pendiente V1.1) |

## Notas
- Los endpoints de Ledger mencionados en algunos documentos de backend (Fase 6) han sido sincronizados exitosamente desde el `openapi.json` del backend local, exponiendo eventos, resumen y timeline.
- A diferencia de otros flujos, en `Accounts` y `Cash Entry` el `idempotency-key` se autogenera en el frontend (`crypto.randomUUID()`) como header.
- El endpoint `DELETE /api/v1/categories/{category_id}` existe en el backend y está envuelto en `src/lib/api/endpoints.ts`, pero **no se expone en la UI V1** por seguridad contable. 
- **Categories inactive management**: Pendiente Backend V1.1. `GET /api/v1/categories` debe soportar `include_inactive=true`. `PATCH /api/v1/categories/{id}` debe soportar `is_active`. Backend debe prevenir duplicados por `user_id + type + normalized_name`. Hasta que eso exista, el frontend V1 no expone desactivación ni eliminación de categorías.
- Por políticas estrictas, el frontend **no inventará endpoints ni DTOs** para estos servicios hasta que se formalicen y publiquen en el archivo `openapi.json` oficial.
- **Opening Balance / Saldo Inicial**: Backend V1.1 pendiente por exponer operaciones como `opening_balance` o `balance_adjustment` en el ledger, para evitar que el frontend inyecte saldos iniciales como un `income` falso, lo cual contaminaría los snapshots. No se pedirá saldo inicial en UI hasta entonces.
- **Snapshot Money Semantics Review**: Pendiente Backend V1.1 definir con exactitud `available_real`, `safe_money`, y `free_money`. Queda pendiente confirmar casos donde `free_money` resulta mayor que `available_real`, cómo los `goal_contributions` afectan las métricas, y alinear `ask_free_money` del Chat con el Snapshot.

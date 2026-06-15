# Nexum Frontend - Known Issues

## APIs y Contratos
* ~~**Ledger / Recent Activity Endpoints**: La documentación general menciona la existencia de endpoints de ledger...~~ **RESUELTO**: Contrato sincronizado exitosamente con el backend, exponiendo endpoints de `events`, `summary` y `timeline`.
* **OpenAPI Público Bloqueado**: El entorno backend configurado en `NEXT_PUBLIC_API_BASE_URL` devuelve 404 Not Found al intentar consultar `/openapi.json` y `/docs`. Por lo tanto, no es posible resincronizar dinámicamente un esquema más reciente. La integración depende estrictamente de lo estipulado en `docs/context/openapi.json`.
* **Accounts Limitations**: El contrato `AccountCreate` definido en el `openapi.json` actual (Fase 7) NO soporta el atributo `initial_balance`. Por esta razón, el formulario de creación de cuentas en el frontend carece de un campo de saldo inicial y sólo crea la cuenta. Modificar el balance se asume como una acción del Ledger y no de la cuenta misma, o al menos no está expuesto en AccountCreate. Adicionalmente, la edición (PATCH) y desactivación (DELETE) aún no han sido expuestas en la UI hasta validar el flujo deseado (hard vs soft delete).
* **Opening Balance / Saldo Inicial (Pendiente V1.1)**: Decisión de producto estricta: El saldo inicial NO debe registrarse como un `income` normal para no contaminar el cashflow mensual, total income, insights de IA ni el dinero libre. Se requiere que el backend implemente una operación contable específica (ej. `opening_balance` o `balance_adjustment`) en futuras versiones. El frontend NO implementará campo de saldo inicial hasta que este contrato oficial exista.
* **Snapshot Limitations**: El `IntelligenceSnapshotRead` proporciona resúmenes numéricos como `available_real` y `free_money`, pero no retorna la matriz de historial reciente ni transferencias. **RESUELTO PARCIALMENTE**: Se integró manualmente `api.ledger.events({ limit: 5 })` en el Home como alternativa a la falta de events en el payload de Snapshot.
* **Pending Backend Updates**: 
  * `opening_balance` / `balance_adjustment` are pending Backend V1.1 to avoid faking opening balances as `income`.
  * `DELETE /api/v1/categories/{category_id}` existe en backend, pero no se expone en UI V1 por seguridad contable. La eliminación definitiva de categorías queda reservada para una futura experiencia admin o para una decisión backend/producto más segura. En UI usuario final solo se permite desactivar.
  * **Categorías del Sistema**: Actualmente el backend solo expone `sin_clasificar` como categoría global del sistema. Las categorías base de usuario se manejan como categorías personalizadas creadas durante onboarding. Queda pendiente decidir en Backend/Product V1.1 si debe existir un catálogo global base más amplio.
  * **Categorías Inactivas y Duplicados**: Categories inactive management is blocked pending Backend V1.1:
    - `GET /api/v1/categories` debe soportar `include_inactive=true` o endpoint equivalente.
    - `PATCH /api/v1/categories/{id}` debe soportar `is_active` true/false de forma confiable.
    - Backend debe prevenir duplicados por `user_id + type + normalized_name` incluso si una categoría está inactiva.
    - Hasta que eso exista, el frontend V1 no expone desactivación ni eliminación de categorías.
* **Chat Bug (ask_free_money)**: Se ha detectado un bug funcional o de integración en el Chat relacionado con la consulta de dinero libre (`ask_free_money`). Queda documentado para su posterior resolución en coordinación con el backend.

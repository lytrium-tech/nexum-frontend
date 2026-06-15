# Nexum Frontend - Known Issues

## APIs y Contratos
* **Ledger / Recent Activity Endpoints**: La documentación general menciona la existencia de endpoints de ledger (`GET /api/v1/ledger/events`, `GET /api/v1/ledger/summary`, etc.), pero estos **no se encuentran** en la definición de `openapi.json` actual (Fase 5/6).
* **OpenAPI Público Bloqueado**: El entorno backend configurado en `NEXT_PUBLIC_API_BASE_URL` devuelve 404 Not Found al intentar consultar `/openapi.json` y `/docs`. Por lo tanto, no es posible resincronizar dinámicamente un esquema más reciente. La integración depende estrictamente de lo estipulado en `docs/context/openapi.json`.
* **Snapshot Limitations**: El `IntelligenceSnapshotRead` proporciona resúmenes numéricos como `available_real` y `free_money`, pero no retorna la matriz de historial reciente ni transferencias. La UI de Actividad Reciente se encuentra suspendida hasta que la versión en el backend incluya el endpoint.

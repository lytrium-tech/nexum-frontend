# Nexum Frontend - Known Issues

## APIs y Contratos
* ~~**Ledger / Recent Activity Endpoints**: La documentación general menciona la existencia de endpoints de ledger...~~ **RESUELTO**: Contrato sincronizado exitosamente con el backend, exponiendo endpoints de `events`, `summary` y `timeline`.
* **OpenAPI Público Bloqueado**: El entorno backend configurado en `NEXT_PUBLIC_API_BASE_URL` devuelve 404 Not Found al intentar consultar `/openapi.json` y `/docs`. Por lo tanto, no es posible resincronizar dinámicamente un esquema más reciente. La integración depende estrictamente de lo estipulado en `docs/context/openapi.json`.
* **Snapshot Limitations**: El `IntelligenceSnapshotRead` proporciona resúmenes numéricos como `available_real` y `free_money`, pero no retorna la matriz de historial reciente ni transferencias. **RESUELTO PARCIALMENTE**: Se integró manualmente `api.ledger.events({ limit: 5 })` en el Home como alternativa a la falta de events en el payload de Snapshot.

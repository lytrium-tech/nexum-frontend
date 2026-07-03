# Handoff: Frontend to Backend V1.6

## 1. Contexto General
El frontend V1.6 ha implementado y estabilizado la nueva arquitectura "Obligations Core" basada en Periodos y el nuevo flujo de "Create Obligation". No obstante, se han detectado inconsistencias en el backend que deben resolverse para garantizar una correcta experiencia.

## 2. P0 Backend Issue: GET /api/v1/intelligence/snapshot
GET /api/v1/intelligence/snapshot fails with HTTP 500 when archived/inactive accounts exist.

Frontend mitigation:
- Dashboard no longer crashes.
- Dashboard renders partial controlled state.
- Frontend does not recalculate financial truth.

Backend required fix:
- Snapshot must handle archived/inactive accounts.
- Snapshot must return truth fields or safe empty values.
- Frontend cannot fully restore financial dashboard numbers without backend source of truth.
## 3. Implementación de Obligations V1.6
- **Creación de Obligación:** El flujo de creación de obligaciones se ha integrado con éxito utilizando el esquema completo generado `ObligationCreate` enviado a `POST /api/v1/obligations`.
- **Delegación de Cálculos:** El frontend NO crea periodos localmente, NO calcula distribuciones de pagos FIFO, NO infiere estados de vencimiento y NO calcula lógicas financieras o de Remaining Amount.
- **Actualización Optimizada:** Tras operaciones de pago o mutación, el frontend se limita a invocar un recálculo desde el backend o a refrescar los endpoints relevantes.

Este documento sirve como evidencia de los findings del frontend que deben abordarse en la evolución del API.

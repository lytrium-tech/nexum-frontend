# Nexum V1.7 — FIFO Payment Phase 5B.2

## 1. Executive Summary
Esta fase implementó la lógica de pagos FIFO (First In, First Out) a nivel de obligación en el frontend de Nexum V1.7. Tras una auditoría exhaustiva del backend de producción, se descubrió que el endpoint `POST /api/v1.7/obligations/{obligation_id}/payments` junto a la lógica subyacente `pay_obligation_fifo` ya estaban completamente implementados y probados mediante Pytest, satisfaciendo todas las reglas de negocio establecidas, como la integración nativa con FX Rate Snapshot para el modo cross-currency. Como resultado, la implementación se centró íntegramente en la interfaz visual y la conexión a la API desde el frontend, permitiendo la previsualización, invocación y manejo de pagos FIFO.

## 2. Backend Contract Consumed
- Endpoint: `POST /api/v1.7/obligations/{obligation_id}/payments`
- El payload obvia por completo campos legacy de previsualizaciones y no confía cálculos derivados en el cliente (`source_amount`, `quote_id`). Solo transfiere IDs duros y el monto original en moneda de la obligación: `amount`, `source_account_id` y en casos de multidivisa: `rate_snapshot_id`.
- Reglas FIFO aplicadas por backend: se cubren primero los periodos pendientes ordenados por su `due_date`, actualizando estados transitorios (como `partially_paid`) si el pago no abarca la totalidad adeudada, y garantizando un único registro de débito y contabilidad.

## 3. Files Changed (Frontend)
1. `src/app/app/obligations/v17-actions.ts`: Adición de la acción de servidor `payObligationFifoV17Action`.
2. `src/app/app/obligations/ObligationsV17Client.tsx`: Inclusión del botón "Pagar obligación" que acciona el pago. Reutilización completa de la modal `payModal` incluyendo las lógicas dinámicas de FX Rate Snapshot (Cross-Currency), pero redirigiendo el envío de los datos a la acción FIFO.

## 4. FX Snapshot Integration & Cross-Currency
El flujo aprovecha directamente la infraestructura introducida en la versión FX Rate Snapshot. Cuando un usuario desea realizar un pago FIFO y selecciona una cuenta de origen con una moneda distinta a la de la obligación, el frontend recaba en tiempo real el tipo de cambio base vigente sin depender de la entrada del input. Si el tipo de cambio expira u ocurre otro impedimento, se comunica inmediatamente al usuario deshabilitando el botón y presentando descripciones controladas sin crashear el render principal (capturadas bajo errorcodes `fx_rate_snapshot_expired`, `invalid_fx_quote` en las Server Actions).

## 5. Same-Currency Behavior
Al operar en una sola moneda, la solicitud no incorpora `rate_snapshot_id`, invocando el endpoint FIFO sin dependencias exógenas sobre tasas de cambio.

## 6. History / Ledger & Status Updates
Los pagos FIFO repercuten uniformemente en las visualizaciones de V1.7 una vez concluido el Action:
- Las etiquetas de periodo correspondientes pasan progresivamente a `paid` o `partially_paid`.
- La caché se purga revalidando localmente (`obligations`, `obligations_summary`, `accounts`, `history`) sin recurrir a estados redundantes ni N+1 peticiones manuales.
- El saldo global se actualiza al instante.

## 7. Quality Assurance
**Backend**:
- Pruebas FIFO pre-existentes validadas exitosamente a través de Pytest:
  - `test_pay_fifo_pays_overdue_before_current`
  - `test_pay_fifo_rejects_overpayment`
  - `test_pay_obligation_fifo`
  - `test_pay_obligation_fifo_missing_idempotency_key`
**Frontend**:
- Escaneos exhaustivos demostraron un árbol sano:
  - `pnpm lint`: Ningún error.
  - `pnpm build`: Pasó de manera exitosa confirmando las nuevas dependencias tipificadas.

## 8. Known Risks / Next Steps
No hay riesgos inmediatos destacables, el comportamiento del servidor delega toda la responsabilidad contable preservando la UI tonta (dumb-UI architecture). El código está completamente listo para la fase de pruebas manuales y despliegue final si Steven aprueba el QA interactivo.

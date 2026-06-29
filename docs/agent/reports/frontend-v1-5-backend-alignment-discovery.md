# Frontend V1.5 — Backend Alignment Discovery

## 1. Executive Summary
El análisis demuestra que el backend V1.5 tiene contratos desplegados y listos para soportar características avanzadas de UX como previsualizaciones (FX Previews) de pagos, metadatos temporales de obligaciones y estimaciones de totales multidivisa (`estimated_totals`). Sin embargo, se identificaron gaps (inexistencia de previsualizaciones para transferencias y metas) y la necesidad de una sincronización final del OpenAPI. El frontend no debe calcular ningún valor derivado.

## 2. Backend V1.5 Reviewed Sources
- `../backend/openapi.json`
- `../docs/handoff/backend/backend-to-frontend-v1-5.md`
- `docs/context/frontend-current-state.md`
- `docs/context/frontend-backend-findings.md`
- `docs/project/changelog.md`

## 3. OpenAPI Sync Status
Se requiere sincronización (Sync needed). El archivo OpenAPI del backend incluye ahora campos como `is_pay_early_eligible` y esquemas de `*PreviewCreate` (e.g., `ObligationPaymentPreviewCreate`), permitiendo valores `null` en el `amount` de obligaciones que el cache local del frontend no posee completamente o difiere en estructura estricta.

## 4. Current Frontend State
El frontend completó las fases fundamentales de V1.5 (Credit Statements, Installments, Early Payment base, FX metadata displays). El sistema se encuentra estable, compilando correctamente, pero con margen de mejora en UX, manejo de errores y consumo de las capacidades de `preview` y alertas visuales.

## 5. Transfer History Alignment
- **Evaluación UX**: Es técnicamente posible separar las transferencias o mostrarlas en el historial general filtrado, ya que el backend tipa explícitamente los eventos.
- **Estado**: UX Decision Needed.

## 6. Multi-Currency Dashboard Alignment
- **Backend provee**: `EstimatedTotals` que incluye `base_currency`, `estimated_total_base_currency` y `is_estimated`.
- **Backend no provee**: Valores individuales convertidos (e.g., el progreso de una meta USD convertido a COP). 
- **Estado**: Parcialmente READY_TO_IMPLEMENT (solo para el total del Dashboard). Valores individuales requerirían cálculo local (prohibido) o un nuevo contrato (CONTRACT GAP).

## 7. Obligations Alert UX Alignment
- **Backend provee**: `period_status`, `days_until_due`, `next_due_date`, `is_pending`, `paid_this_period`.
- **Estado**: READY_TO_IMPLEMENT. Las alertas de vencimiento pueden derivarse íntegramente de la lectura pasiva de estos campos inmutables.

## 8. Paid Installments / Paid Items Visibility
- **Backend provee**: `status` en cuotas (`paid`, `frozen`) y en estados de cuenta.
- **Estado**: READY_TO_IMPLEMENT. Permite separar las cuotas mediante filtros sin cálculos extra. Requiere decisión de diseño (UX_DECISION).

## 9. FX Preview Availability
- **Backend provee**: `/api/v1/obligations/{id}/payments/preview` y `/api/v1/credit/cards/{id}/purchases/{id}/pay_early/preview`.
- **Backend no provee**: Previews para Transfers o Goal Contributions.
- **Estado**: READY_TO_IMPLEMENT (para Obligations y Early Payment). CONTRACT GAP (para Transfers y Goals).

## 10. Financial Error Handling Audit
La auditoría fue completada (`Phase 2`). Se creó un helper central `handleFinancialError` para evitar enmascarar errores. Los códigos 403 genéricos ya no se mapean a moneda no soportada, y se implementó un mapeo humano para errores comunes (insuficiencia de fondos, cuentas inválidas, estados cerrados).

## 11. Contract Gaps
1. **Transfers / Goals FX Previews**: Faltan endpoints de previsualización para estos módulos.
2. **Item-Level Currency Conversion**: No hay campos que entreguen el progreso o saldo de un ítem individual (metas/obligaciones) convertido a `base_currency`.

## 12. Frontend Bugs
No hay bugs críticos bloqueantes detectados (el error de lint en `ObligationsClient.tsx` fue solucionado en Phase 1). El enmascaramiento de errores (error masking) fue solucionado en Phase 2.

## 13. Backend Follow-ups
1. Evaluar si se crearán endpoints de FX preview para Transfers y Goal Contributions.
2. Evaluar entrega de conversiones a `base_currency` a nivel de ítem si Producto lo requiere.

## 14. UX Decisions Needed
1. ¿Separar el historial de transferencias o mantener filtros en el Ledger general?
2. ¿Ocultar las cuotas/tarjetas/obligaciones pagadas por defecto, o simplemente atenuarlas visualmente?

## 15. Recommended Implementation Phases
- **Phase 1** — OpenAPI sync y recuperación de tipos (completado).
- **Phase 2** — Financial error handling cleanup (completado).
- **Phase 3** — Obligations visual alerts (completado).
- **Phase 4** — Transfer history UX decision & implementation (completado).
- **Phase 5** — Multidivisa dashboard (usando `estimated_totals` globales ya proveídos).
- **Phase 6** — FX previews para Obligations y Early Payments (consumiendo los contratos existentes).
- **Phase 7** — Final QA y closeout de V1.5 UX improvements.

## 16. Defer to Nexum V2
- Previsualizaciones FX para Transferencias y Metas (hasta que el backend exponga los endpoints).
- Conversión multidivisa a nivel de ítem individual (Dashboard avanzado).

## 17. Final Recommendation
Aprobar la sincronización del OpenAPI (Phase 1) y avanzar progresivamente implementando las mejoras de UX que ya cuentan con respaldo total del backend (Alertas visuales, Previews de crédito/obligaciones). Abstenerse estrictamente de calcular estimados FX o fechas de vencimiento en el frontend.

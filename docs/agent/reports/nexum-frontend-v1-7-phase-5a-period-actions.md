# Reporte de Auditoría: Frontend V1.7 Phase 5A (Period Actions)

## Objetivo
Conectar las acciones de periodo no relacionadas con pagos en la nueva UI read-only V1.7, implementada detrás de `NEXT_PUBLIC_NEXUM_OBLIGATIONS_V17_ENABLED`. Las acciones incluyen: definir monto, saltar periodo, cancelar periodo y actualizar vencimientos (refresh overdue).

## Archivos modificados
- `src/app/app/obligations/ObligationsV17Client.tsx`
- `docs/agent/reports/nexum-frontend-v1-7-phase-5a-period-actions.md` (este reporte)

## Acciones conectadas
- `getObligationPeriodsV17Action`: Carga la lista de periodos de cada obligación de forma concurrente tras cargar la lista principal.
- `updateObligationPeriodAmountV17Action`: Conectada al modal de "Definir monto", envía el intent numérico al backend.
- `skipObligationPeriodV17Action`: Conectada al modal de confirmación de "Saltar".
- `cancelObligationPeriodV17Action`: Conectada al modal de confirmación de "Cancelar".
- `refreshOverduePeriodsV17Action`: Conectada al botón "Actualizar vencimientos" en la tarjeta de cada obligación.

## Acciones NO conectadas todavía (Reservadas para Phase 5B)
- `payObligationPeriodV17Action` (pago de periodo específico).
- `payObligationFifoV17Action` (pago general FIFO).
- Lógica de preview FX.

## Validaciones QA
- **Feature flag false QA**: El flujo heredado permanece sin cambios ni interrupciones (el código legacy en `ObligationsClient` y sus importaciones se mantienen intactas).
- **Feature flag true QA**: Las tarjetas ahora procesan el array de periodos V1.7 que devuelve el endpoint. El periodo "relevante" se identifica leyendo el `status` sin inferir reglas complejas locales.
- **Define amount**: El input captura el string, convierte a Number y llama a la mutation, reaccionando a success llamando `fetchAllData()` para que el backend recalcule.
- **Skip period**: Llama mutation, se auto-recarga el summary y periods del backend.
- **Cancel period**: Ídem, el frontend no asume localmente que status = cancelled.
- **Refresh overdue**: Un botón discreto desactiva acciones brevemente y ejecuta el sync server-side, refrescando desde el backend.
- **Post-mutation refresh**: Cada acción cierra su modal y delega el state refetch al wrapper asíncrono (`fetchAllData()`). Ninguna muta optimísticamente local.
- **403 / 401 handling**: Delegado elegantemente por `v17-actions.ts`. Si falla localmente un action, `actionError` muestra el string friendly ("No pudimos definir...").

## Restricciones Financieras (No local truth)
Ninguna de las acciones calcula matemáticamente. No hay sumas, restas ni cálculo de `remaining_amount` en el frontend. Si un pago está incompleto, se muestran los strings `amount_due` y `amount_paid` directo desde el backend.

## Verificación de estado
- **Lint**: Pasó exitosamente.
- **Build**: Pasó exitosamente (`Compiled successfully in 2.9s`).

## Riesgos para Phase 5B
La implementación de pagos y FIFO requerirá componentes especializados para previsualizar el impacto (FX/Preview). Habrá que cuidar la interacción con Supabase auth para enviar los headers de idempotencia.

## Conclusión
La Fase 5A está lista para commit limpio.

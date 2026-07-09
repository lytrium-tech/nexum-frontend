# Nexum V1.7 — Frontend Local Sync FX Rate Snapshot

## 1. Executive Summary
El frontend fue sincronizado de manera exitosa para consumir el nuevo flujo de cotización de pagos multi-divisa (FX Rate Snapshot) implementado en el backend de producción. El frontend ya no depende del uso de previsualizaciones dinámicas cada vez que cambia el monto. En su lugar, el frontend obtiene el `rateSnapshot` estático del backend una vez, y utiliza dicha tasa para realizar previsualizaciones puramente visuales y rápidas en la UI. Finalmente, envía únicamente el identificador del snapshot junto al monto para que el backend realice el cálculo de la verdad financiera definitiva.

## 2. Backend Contract Consumed
- El frontend consume ahora `GET /api/v1.7/fx/rates/latest?from_currency={base}&to_currency={quote}` en lugar de `POST /api/v1.7/obligations/{id}/periods/{period_id}/payments/preview`.
- La confirmación del pago se hace enviando `rate_snapshot_id: rateSnapshot.id` y omitiendo por completo los campos `source_amount` y `quote_id`.

## 3. Files Changed
1. `docs/contracts/openapi.json`: Actualizado desde el VPS del backend en commit fcd47c0.
2. `src/lib/api/types.generated.ts`: Regenerado para reflejar el nuevo endpoint de snapshot y la eliminación del `quote_id`.
3. `src/lib/api/endpoints.ts`: Añadida función `getLatestRate` bajo `fxV17` y eliminada la función de preview.
4. `src/app/app/obligations/v17-actions.ts`: Eliminado `previewObligationPeriodV17Action`. Añadido `getLatestFxRateV17Action`. Incluido manejo de errores `fx_rate_snapshot_expired`, `invalid_fx_quote` y asociados.
5. `src/app/app/obligations/ObligationsV17Client.tsx`: Modificación completa del `useEffect` de preview para dispararse solamente al elegir monedas dispares. Inclusión de preview instantáneo calculando sobre `rateSnapshot`. Uso de `rate_snapshot_id` en el submit.

## 4. OpenAPI / Types Sync
El openapi.json descargado directamente del ambiente de producción (`fcd47c0`) reflejó el nuevo endpoint `GET /api/v1.7/fx/rates/latest`. Al ejecutar `pnpm api:generate`, se poblaron los tipos correctos para la interfaz (`FXRateSnapshotResponse`) y los campos de `rate_snapshot_id` en los payloads transaccionales (`ObligationPeriodPaymentCreateRequest`). Se confirmó que tanto `source_amount` como `quote_id` dejan de ser campos requeridos en el nuevo flujo.

## 5. Latest Rate Integration
Se ha implementado el endpoint global de tasas dentro del archivo de acciones de servidor como `getLatestFxRateV17Action`. El frontend ahora almacena y depende de los valores de ID, tasa (`rate`), y expiración, consumiendo el endpoint tan pronto se detecta discrepancia de monedas en la modal de pagos, controlando posibles errores HTTP (401, 403) sin arrojar excepciones no controladas.

## 6. Payment Payload Changes
El payload de pago cross-currency pasó de:
`{ amount, source_account_id, quote_id }`
a:
`{ amount, source_account_id, rate_snapshot_id }`
El backend será el encargado de derivar internamente el monto debitado (es decir, el `source_amount`) de acuerdo a la tasa estipulada en el snapshot inmutable con el respectivo ID provisto.

## 7. Instant Preview UX
Ya no hay una demora en red por cada tecla pulsada. Si se trata de un pago cross-currency, el frontend adquiere primero la tasa; posteriormente, a medida que el usuario ajusta el valor, el componente UI realiza el cálculo simple (`amount / rateSnapshot.rate`) de manera instantánea, mostrando siempre un estimado visual al usuario en tiempo real sin recargar a los servidores.

## 8. Same-Currency Compatibility
Los pagos de tipo COP → COP u otras operaciones de moneda homóloga continúan operando de manera directa e ininterrumpida. Si la moneda de origen empata con la moneda de destino, el `useEffect` corta el flujo devolviendo un nulo sobre el `rateSnapshot`, deshabilitando en efecto tanto la previsualización como el envío del `rate_snapshot_id`.

## 9. Legacy Preview Status
Se purgó por completo del código frontend la llamada antigua del preview de obligaciones (`previewObligationPeriodV17Action`), asegurando que no queden referencias rotas o zombies. Su eliminación es 100% segura debido a que el componente UI se modificó íntegramente para operar bajo el esquema del `rateSnapshot`. No obstante, cabe resaltar que el endpoint en el backend (`/api/v1.7/obligations/{id}/periods/{period_id}/payments/preview`) posiblemente persista en producción hasta que se complete el refactor correspondiente del lado del servidor.

## 10. Error Handling
La UI captura el escenario donde la conversión falla o el proveedor se encuentre inalcanzable. Se ha ampliado `handleV17Error` en el manejador de V1.7 para interceptar e interpretar errores de snapshots de backend, tales como `fx_rate_snapshot_expired`, `invalid_fx_quote`, y `fx_rate_snapshot_not_found`, desplegando notificaciones amistosas a la interfaz ("La cotización de conversión ha expirado. Por favor, intenta nuevamente.") y bloqueando el botón de confirmar pago cuando no haya un snapshot válido.

## 11. Validation Results
El código pasó una ejecución exitosa de `pnpm lint`, sin advertencias ni errores relacionados a tipos faltantes. La compilación estática y dinámica a través de `pnpm build` también validó que el tipado inferido de openapi y el enrutamiento operan en armonía. No se rompió la UI general del dashboard y la retrocompatibilidad con las dependencias existentes se conserva.

## 12. Known Risks / Follow-ups
- Backend FX Rate Snapshot refactor is already deployed to the VPS under commit fcd47c0, with DB at v1_7_phase_fx_rate_snapshot (head). Frontend local QA can now proceed against https://api.nexum.lytrium.tech. Remaining risks are local QA findings, auth/session behavior, expired snapshot UX, and future removal of the temporary NEXT_PUBLIC_NEXUM_OBLIGATIONS_V17_ENABLED flag.
- Remover temporal feature flag (`NEXT_PUBLIC_NEXUM_OBLIGATIONS_V17_ENABLED`) tan pronto QA confirme operación de ambos lados.

## 13. Ready for Steven Local QA
El frontend local V1.7 está listo para QA local de Steven usando pnpm dev y la API https://api.nexum.lytrium.tech. Backend FX Rate Snapshot ya está desplegado en VPS. No existe frontend deploy ni Vercel.

# Frontend V1.5 — Full Backend Alignment Discovery

## 1. Contexto

Backend V1.5 está cerrado y desplegado. El backend ha introducido un modelo avanzado de tarjetas de crédito (Credit Card Advanced Model) que incluye facturación, cuotas, cascada de pagos y pago anticipado. Además, incluye semántica de tiempo estricta para metas (Goals) y obligaciones (Obligations), así como saldos multimoneda de forma nativa.

El mandato de arquitectura es estricto: **"Backend calcula. Frontend representa. LLM explica."**
Cualquier cálculo local en el frontend (como estimaciones de deuda, recalculación de pagos, conversiones de moneda) debe ser eliminado y reemplazado por los valores que ahora expone el backend.

## 2. Hallazgos y Alineación Actual

### 2.1 Goals y Obligations (Time Semantics & FX)
- **Estado actual**: Se verificó el código en `GoalsClient.tsx` y `ObligationsClient.tsx`.
- **Hallazgo**: Ya están consumiendo directamente las propiedades calculadas por el backend.
  - *Goals* usa `progress_percentage`, `period_status`, `monthly_required`, `daily_required_this_period`, `remaining_required_this_period`, y `current_amount`.
  - *Obligations* usa `remaining_amount`, `period_status`, y `paid_this_period`.
- **Acción requerida**: Ninguna. La alineación de Goals y Obligations (fases 1 a 3 del sprint anterior) completó esta integración correctamente.

### 2.2 Credit Cards (Advanced Model)
- **Estado actual**: `CreditClient.tsx` ya renderiza propiedades modernas: `billed_debt`, `unbilled_debt`, `statement_balance`, `available_credit`, `payment_required` y `next_payment_estimate`. 
- **Hallazgo**: A diferencia del modelo antiguo (que dependía solo de `current_debt`), la UI básica del dashboard ya consume los campos base del modelo avanzado.
- **Déficit**: 
  - Faltan los controles y vistas para consultar los *Statements* (extractos) persistidos e inmutables del ciclo de facturación (`GET /api/v1/credit/accounts/{id}/statements`).
  - Faltan las vistas para examinar las cuotas (Installments) (`GET /api/v1/credit/accounts/{id}/installments`).
  - Falta el flujo de UI y la conexión en `endpoints.ts` y `actions.ts` para el pago anticipado de compras (`POST /api/v1/credit/accounts/{id}/purchases/{purchase_id}/pay_early`).

### 2.3 API y Endpoints
- **Estado actual**: `src/lib/api/endpoints.ts` tiene los endpoints base de tarjetas de crédito.
- **Déficit**: Faltan mapear:
  - `credit.cards.statements(id)`
  - `credit.cards.statement(id, period)`
  - `credit.purchases.pay_early(cardId, purchaseId, payload)`

## 3. Clasificación de Impactos

1. **REPLACE_WITH_BACKEND_FIELD / REMOVE_FRONTEND_CALCULATION**:
   - Completado previamente. El frontend ya no calcula deudas totales basadas en compras/pagos; simplemente consume `billed_debt` y `unbilled_debt`.

2. **EXPOSE_NEW_UI**:
   - **Credit Card Statements Modal/View**: Interfaz para ver los extractos congelados (`statement_balance`, `billing_period`, `minimum_payment`, etc).
   - **Installments View & Early Payment Control**: Interfaz para ver el cronograma de cuotas y un botón/flujo explícito para "Pagar anticipadamente" (Pay Early) asociado a una compra, que indique a la API la cuenta de origen para debitar y el modo de asignación.

## 4. Fases de Implementación Propuestas (Phase 4 a 6)

El sprint 1 de Frontend V1.5 cubrió las Fases 1 a 3 (FX y Types). Ahora iniciamos las fases para el Credit Card Advanced Model:

- **Phase 4: API Endpoints Expansion (Completado / Recovered)**
  - Actualizados `src/lib/api/endpoints.ts` y `src/app/app/credit/actions.ts` con `statements`, `installments` y `pay_early`.
  - Contrato recuperado tras fix del backend (commit 63d5578), solventando el CONTRACT GAP.

- **Phase 5: Statements UI (Completado)**
  - Implementado `StatementsList` de forma anidada en `CreditClient.tsx`.
  - Muestra la metadata del extracto inmutable calculada por el backend sin sumar ni inferir datos localmente.
- **Phase 6: Installments & Early Payment UI**
  - Construir una vista detallada de compras a cuotas (Installments) dentro de la tarjeta.
  - Añadir el control "Pagar compra anticipadamente" interactuando con el endpoint `/pay_early`, seleccionando cuenta de origen.

## 5. Conclusión de Discovery
La arquitectura actual del frontend está en un punto sólido porque ya delega la verdad del dashboard al backend. El trabajo restante del V1.5 consiste puramente en agregar la interfaz de usuario para exponer las nuevas capacidades del modelo avanzado de crédito (statements y pay early).

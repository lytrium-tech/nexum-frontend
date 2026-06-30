# Changelog

## [Unreleased] - Frontend V1.5
### Changed
- **Fase 1**: Sincronizado el contrato OpenAPI con Backend V1.5 Sprint 1, regenerados los tipos (`TransferResult`, `GoalContributionResult`) para incluir metadata FX (`target_amount`, `fx_rate`, `is_estimated`, etc). Build recuperado exitosamente sin requerir refactorización profunda.
- **Fase 2**: Implementada la visualización de transferencias cruzadas en `TransfersClient.tsx`. Se agregó la lógica para enviar `currency` en la creación y mostrar el desglose (monto origen, monto recibido destino y tasa aplicada). Manejo mejorado del error de moneda no soportada.
- **Fase 3**: Implementada la visualización de contribuciones cruzadas en `GoalsClient.tsx`. El mensaje de éxito muestra el desglose del monto objetivo con la tasa aplicada. Manejo mejorado del error de moneda no soportada.
- **Fase 4**: Añadidos los métodos y actions tipados para interactuar con los nuevos endpoints del modelo avanzado de tarjetas de crédito (`installments`, `pay_early`). Contrato de statements integrado y verificado exitosamente.
- **Fase 5**: Implementada la interfaz de lectura interactiva para Extractos de Tarjeta de Crédito (Statements) (`StatementsList` en `CreditClient.tsx`). La interfaz consolida la información financiera inmutable calculada por el backend, incluyendo cortes, pagos, comisiones, intereses y estado de la facturación, sin añadir recálculos locales de deuda o pagos.
- **Fase 6**: Implementada la interfaz de lectura para Cuotas (Installments) (`InstallmentsList` en `CreditClient.tsx`) y modal para Pagos Anticipados explícitos usando el endpoint de `pay_early`. El cálculo exacto del monto del pago anticipado está delegado 100% al backend para mantener coherencia financiera. No se efectúan cálculos ni optimistic updates de la deuda localmente.
- **UX Improvements Phase 1**: Synchronized OpenAPI with the latest Backend V1.5 contracts, regenerated types, and fixed lint/type recovery. No UX features implemented yet. Preview contracts are now available for future phases.
- **UX Improvements Phase 2**: Cleaned financial error handling. Unsupported currency message is now only shown for explicit unsupported currency/FX errors. Generic 403 no longer maps to COP/USD.
- **UX Improvements Phase 3**: Added passive visual alerts for obligations using backend-provided period_status, days_until_due, next_due_date and remaining_amount. No local due-date or remaining amount calculations.
- **UX Improvements Phase 4**: Improved transfer history UX while keeping transfers visible in general History/Ledger. Transfers remain traceable and are not treated as income/expense. No FX preview implemented because backend does not expose transfer preview endpoints.
- **UX Improvements Phase 5**: Improved Dashboard multi-currency presentation using backend-provided `estimated_totals`. Currencies are sorted conceptually (COP, USD, EUR) for visual presentation. Added explicit trust copy for estimations. Item-level base currency conversion deferred to V2.
- **UX Improvements Phase 6**: Implemented backend-powered FX previews for Obligation payments and Credit Card early payments. Realtime FX preview added using debounced backend preview calls. Frontend does not calculate FX locally and requests `PaymentPreviewResult` displaying precise backend-calculated amounts before user confirms. Transfers and Goals previews remain deferred unless backend exposes preview endpoints.
- **UX Improvements Phase 7**: Final QA and document closeout completed for V1.5 UX enhancements. All frontend code is aligned with production Backend V1.5 constraints. Realtime FX previews validated against production backend.

## [Unreleased] - Frontend V1.3 Alpha Candidate Status
### Changed
- Sincronización del contrato OpenAPI con Backend V1.3 y regeneración de tipos.
- Recuperación del compilador (build) validando la incorporación limpia de nuevos campos (`covered`, `is_active`, `include_archived`, `currency`).

## [Unreleased] - Frontend V1.2 Alpha Candidate Status
### Status
- Frontend V1.2: CLOSED
- Closed Alpha Candidate: NOT READY
- Reason: Backend blockers affecting financial trust

## [Unreleased] - Fase 2
### Added
- Integración de Supabase SSR (`@supabase/ssr`).
- Páginas mínimas de autenticación (`/login`, `/signup`).
- Middleware de Next.js para protección de rutas y refresco de sesión en Supabase.
- Configuración de generador de tipos `openapi-typescript` mediante `pnpm api:generate`.
- Cliente de API Fetch centralizado (`src/lib/api/client.ts`) para estandarización de headers y errores.
- Guardias de autenticación (`app/layout.tsx`) para la inicialización idempotente del usuario (`POST /api/v1/users/me/bootstrap`).
- Redirección obligatoria de Onboarding (`/onboarding/wallet`) en ausencia de cuentas financieras.
- UI mínima de creación de cuenta bajo `AccountCreate` DTO (limitado a Name, Type y Currency).
- Constante temporal `TEMPORARY_ALPHA_CATEGORY_FALLBACK` para categorías del Alpha Privado.

## [Unreleased] - Fase 10 (Frontend Alpha Readiness Audit)
### Changed
- Auditoría general estática completada exitosamente. Se certifica el frontend como apto para inicio de Alpha Cerrada V1.1.

## [Unreleased] - Frontend V1.4
### Changed
- **Fase 1**: Sincronizado el contrato OpenAPI con Backend V1.4, requiriendo validación de tipos por obligatoriedad de la moneda (`currency`) en los esquemas de creación (`GoalCreate`, `ObligationCreate`, etc). Agregados los tipos auxiliares temporales `currency: "COP"` para recuperar el build. Verificado el nuevo modelo de snapshot incorporando soporte a la capa de agregación `estimated_totals`.
- **Fase 2**: Reemplazados los hotfixes temporales `currency: "COP"` por selectores explícitos de moneda (COP/USD/EUR) en los formularios de creación de Goals, Obligations y Credit Cards (Accounts ya lo tenía). Para nuevos movimientos manuales, la moneda se hereda automáticamente de la cuenta seleccionada (`NewEntryClient`). Tipos estrictos aplicados en `FinancialHero`.
- **Fase 3**: Implementada la UI para renderizar totales estimados (`estimated_totals`) bajo un esquema seguro que informa origen de la tasa y fecha (`rate_source`, `rate_timestamp`), así como advertencias para monedas no soportadas (`unsupported_currencies`). Confirmada la finalización del Retest de Producción contra Backend V1.4.1/V1.4.2 con Dashboard y Ledger plenamente operativos en modo multi-moneda.

## [Unreleased] - Fase 9 (Chat Alignment with Backend V1.1)
### Changed
- Añadido el manejo de `pending_action_id` y su estado persistente a lo largo de una conversación.
- Reflejado visualmente el estado de una acción pendiente si el backend retorna `awaiting_confirmation` o `awaiting_clarification`.
- Actualizado el tipo de mensaje y estado devuelto en `ChatInterface.tsx` y `endpoints.ts`.
- Añadido renderizado en modo "read-only" visual para `structured_data` en respuestas del chat. No se deriva nueva lógica financiera.

## [Unreleased] - Fase 8 (Categories V1.1 Alignment)
### Changed
- Añadido el parámetro `include_inactive` al endpoint de lista de categorías en `endpoints.ts`.
- Refactorizado `/app/categories` para usar `is_active` en lugar de borrar categorías.
- Categorías inactivas personalizadas se muestran bajo una sección desplegable de "Categorías Inactivas".
- Permitida la desactivación y reactivación de categorías personalizadas mediante toggle.
- Etiqueta correcta y descripción clara para la categoría `sin_clasificar` (fallback de sistema).

## [Unreleased] - Fase 7.1 (Goals Money Formatting Hotfix + Backend Handoff)
### Changed
- Refactorizado el sistema de formateo monetario con un nuevo utilitario central (`formatMoneyOrDash`) en `src/lib/format/money.ts`.
- Aplicado el nuevo formateador determinista a `GoalsClient.tsx` para solucionar el "Hydration Error" por diferencias de Locale entre cliente y servidor.
- Agregados tres nuevos reportes de "Backend Findings" en los docs compartidos y de frontend:
  1. Necesidad de redondeo de métricas periódicas de metas según reglas de la moneda.
  2. Aclaración de la semántica de la pantalla principal / Cashflow Dashboard (mezcla actual de métricas históricas y mensuales).
  3. Semántica de transacciones de tarjetas de crédito y distinción entre consumo de crédito, pago de deudas y salidas operativas en el backend.

## [Unreleased] - Fase 7 (History / Ledger V1.1 Alignment)
### Changed
- Refactorización de `formatLedgerAmount` en `src/lib/format/ledger.ts` para que soporte campos neutrales y no falsee como positivos/negativos eventos no marcados explícitamente cuando `direction` es nulo, respetando el contrato estricto del backend V1.1.
- Agregados los nuevos nombres descriptivos de eventos contables al mapa de labels (`getLedgerEventName`) incluyendo `manual_adjustment` y todos los flujos de tarjetas y créditos.
- Interfaz gráfica ampliada en `/app/history` incluyendo íconos para cada nuevo tipo de transacción V1.1 (💳, ✓, ★, +).
- Filtros extendidos para permitir navegación por tipos de transacciones avanzadas sin violar la lógica transaccional limpia del backend.

## [Unreleased] - Fase 6 (Credit Cards V1.1 Alignment)
### Changed
- Alineación del componente `CreditClient` y tarjetas visuales para renderizar campos estrictos de deuda e intereses del contrato backend (e.g. `total_debt`, `billed_debt`, `unbilled_debt`, `payment_required`, `next_payment_estimate`, `available_credit`, `statement_balance`).
- Soporte explícito en el formulario de creación para `management_fee`, `monthly_interest_rate`, `annual_interest_rate`, `network` y `franchise`.
- Integración de los endpoints tipados `summary`, `status` e `installments` para futuras vistas de resumen y cuotas en `api/endpoints.ts`.
- Retiro progresivo de variables locales obsoletas de estimación (como `estimated_current_debt` y `estimated_available_credit`) a favor de las oficiales del backend.

## [Unreleased] - Fase 5 (Obligations V1.1 Payment Modes)
### Changed
- El formulario de Creación de Obligación en `/app/obligations` ahora expone la opción explícita de `payment_mode` ("fixed_full_payment", "partial_allowed" y "variable_amount").
- Eliminado el hardcode silencioso de "fixed_full_payment" que limitaba el contrato.
- Las tarjetas de Obligaciones visualizan el estado temporal delegando cálculos al Backend (`paid_this_period`, `remaining_amount`, `period_status`, `is_pending`, `next_due_date`).
- El modal de pago se adapta de forma dinámica según el modo de pago: bloqueando la edición del campo (para cobros fijos de cuota) o permitiendo edición libre de montos (para abonos o montos variables).

## [Unreleased] - Fase 4 (Goals V1.1 Alignment)
### Changed
- Las tarjetas de `/app/goals` se actualizaron para usar la estructura de datos extendida y consumir directamente los cálculos del backend para `current_amount`, `progress_percentage`, `period_status`, `monthly_required`, `required_this_period` y `remaining_required_this_period`.
- Eliminado el cálculo de progreso local y validaciones locales de límites de periodo; ahora toda la representación del estado temporal de las metas proviene del backend.
- Flujo de aportes ahora refresca `accounts`, `history`, `home` y `goals` sin validaciones o bloqueos locales que restrinjan aportes anticipados o fuera de fecha.

## [Unreleased] - Fase 3 (Accounts V1.1 Alignment)
### Added
- Flujo de creación de cuenta en `/app/accounts` y en `/onboarding/wallet` actualizado para enviar de forma correcta el `initial_balance` al backend, asegurando que no cuente como un ingreso mensual.
- Soporte visual para el evento contable `opening_balance` y `balance_adjustment` en el mapeador del historial de transacciones (Ledger), garantizando que se muestren las etiquetas correctas.
- Wrapper para el endpoint `/accounts/{id}/balance-adjustments` expuesto en `api.accounts.createBalanceAdjustment`.

## [Unreleased] - Fase 2 (Snapshot Truth Alignment)
### Changed
- Dashboard (`/app/page.tsx`) actualizado para usar `snapshot.truth` como única fuente de cálculos de liquidez (`available_real`, `safe_money`, `free_money`).
- Eliminada toda lógica de cálculo local de saldos y flujo de caja en componentes de Home (`CashflowSummary`, `DebtOverview`, `GoalsPreview`).
- Componente `FinancialHero` ahora muestra avisos y advertencias de cálculo (`calculation_warnings`) directamente desde el backend.

## [Unreleased] - Fase 1 (Build Recovery & Accounts Contract)
### Fixed
- Recuperación del build tras la adopción del OpenAPI V1.1 resolviendo campos requeridos y tipos nulos en `Accounts`, `CreditCards` y `Obligations`.
- El flujo de creación de cuenta y el onboarding (wallet) ahora envían `initial_balance` al backend y manejan UI básica de ingreso opcional.
- Se añadió el endpoint `balance-adjustments` al cliente API local.

## [Unreleased] - Fase 10 (Goals)
### Added
- Pantalla `/app/goals` para visualizar y administrar metas financieras.
- Flujo de creación de metas alineado con el contrato `GoalCreate`.
- Flujo de aportes a metas asociado a cuentas de origen (reduciendo balance real) vía `GoalContributionCreate`.
- Wrappers del cliente API en `src/lib/api/endpoints.ts` para los endpoints `/api/v1/goals`.
- Exclusión de "Metas" en la barra de navegación móvil (limitada a Desktop Sidebar) para preservar espacio.

## [Unreleased] - Fase 13 (Transfers)
### Added
- Pantalla `/app/transfers` para listar y crear transferencias entre cuentas propias.
- Flujo de creación de transferencias alineado con el contrato `TransferCreate` y el header `Idempotency-Key`.
- Mapeo de errores y validaciones de interfaz para origen=destino y fondos insuficientes.
- Integración en `src/lib/api/endpoints.ts` de los endpoints de Transfers.

## [Unreleased] - Fase 3
### Added
- Refactorización de flujo Bootstrap: se ejecuta de forma paralela e idempotente asegurando JWT previo.
- Integración de Onboarding de Categorías `/onboarding/categories` con backend vía POST `CategoryCreate`.
- Shell Visual Principal protegido bajo `AppShell` (Escritorio Sidebar, Móvil BottomNav).
- Conexión del Dashboard (Home MVP) mediante Fetch paralelo (`snapshot`, `balance`, `cashflow`, `free-money`).
- Estados obligatorios UI: Loading (`loading.tsx`), Empty States para cuentas y dashboard vacío, Error Boundaries para backend inoperativo.

# Wallets V1 Frontend Sync Result

Este documento describe la sincronización de los contratos de Wallets V1 desde el backend de Nexum hacia el frontend.

**Backend baseline:** eb2991a
**Estado de producción backend:** Desplegado en VPS (commit eb2991a) - API api.nexum.lytrium.tech consumible.
**Fecha de sincronización:** Julio 2026

## Cambios realizados
- **OpenAPI Tipos**: Se actualizó `types.generated.ts` apuntando a la definición del backend en `docs/contracts/openapi.json`.
- **Rutas API Client**: Se incorporaron los endpoints `archive`, `restore`, `adjustBalance`, `getMovements` y `getPeriodSummary` en `src/lib/api/endpoints.ts`. La acción de `delete` fue eliminada de la UI.
- **Acciones SSR (BFF-style)**:
  - Se utiliza `updateAccountAction` para editar exclusivamente `name` y `type`.
  - Se crearon `archiveAccountAction`, `restoreAccountAction` y `adjustBalanceAction`.
  - **Nueva estrategia de refresh**: Se introdujo `getAccountScreenDataAction` que orquesta la carga de los tres paneles principales (`account`, `movements`, `summary`) mediante un `Promise.all` desde el servidor, consolidando la actualización del estado UI sin depender de múltiples peticiones CSR aisladas.
- **AccountsClient**:
  - Implementación de menú contextual por cuenta que evita conflictos de clics con la redirección al detalle (`e.stopPropagation()`).
  - Idempotency key estable durante reintentos en ajustes de saldo.
  - Ajuste de cuenta bloqueado si está archivada.
- **Ruta de Detalle (`/app/accounts/[id]`)**:
  - Implementado Next.js SSR en `page.tsx`, utilizando `await params.id` conforme al paradigma asíncrono de params en Turbopack/Next.js 16.
  - La precarga inicial de `account`, `movements`, y `summary` es ahora Server-Side.
  - Refetch tras una mutación sucede vía la Server Action unificada.
  - Se eliminaron dependencias `next/headers` en el componente cliente (corrección de frontera Client/Server).
  - Eliminados los mocks/fallbacks financieros silenciosos: Los errores se visualizan explícitamente y ofrecen botones de reintento en secciones parciales sin colapsar toda la página.

## Limitaciones y Notas UX
- Target balance: la diferencia calculada en UI para ajuste es meramente visual y estimativa.
- Nomenclaturas: No se exponen UUIDs de idempotency key a nivel usuario. 
- Transferencias e ingresos fijos todavía se representan en su propio módulo, pero repercuten contablemente en las billeteras.

## Validaciones Frontend
- ✔ Typecheck (`pnpm tsc --noEmit`): Correcto. Sin warnings de useEffect en el cliente.
- ✔ Linter (`pnpm lint`): Correcto. (Las advertencias react-hooks previas sobre estado en efectos fueron purgadas al mover la invocación CSR al handler puro).
- ✔ Build (`pnpm build`): Correcto. El bundle genera apropiadamente Server y Client components, solucionando la fuga del scope servidor hacia Next Navigation.
- ✔ Estabilidad Idempotente: Garantizada para los retries de red en los envíos de ajustes.

## Estado real
Implementación controlada finalizada y funcionalmente alineada. Preparada para QA visual final y aprobación.

## Siguientes pasos
- Validar el despliegue del backend eb2991a en producción.
- Merge del feature branch hacia default para QA final manual.

# Nexum Frontend — Obligations Closure

## Estado Final
El módulo de Obligaciones (anteriormente experimental bajo V1.7) ha sido cerrado como módulo de producto estable y está plenamente habilitado en el frontend sin depender de feature flags (`NEXT_PUBLIC_NEXUM_OBLIGATIONS_V17_ENABLED` ha sido removido). 

## Endpoints Integrados
- La UI utiliza el endpoint `GET /api/v1.7/obligations/overview` para obtener el estado actual de las obligaciones, previniendo el problema de N+1 llamadas para los periodos.
- `GET /api/v1.7/obligations/summary` alimenta los totales del mes (Pendiente, Vencido, Pagado).

## Flujos Funcionales Completados
- **One-Button Payment:** Funcional. Maneja pagos de saldo completo o parcial desde un solo botón, sin exponer modos de pago técnicos al usuario.
- **Pagos FIFO:** Integrado como parte del One-Button Payment. Los pagos se aplican inteligentemente al saldo pendiente más antiguo.
- **FX Bidireccional:** El preview de tasas de cambio (FX Rate Snapshot) funciona correctamente tanto para COP → USD como para USD → COP, calculando y bloqueando la tasa antes de confirmar el pago.
- **Variables sin monto:** La UI detecta montos pendientes de definición y exige al usuario usar la acción "Definir monto" antes de habilitar el pago.
- **Skip y Cancel:** Periodos pueden ser saltados o cancelados individualmente.
- **Visualización de Pagados:** Las cuotas pagadas (historico) se manejan correctamente o se ocultan si no son el periodo relevante gracias al endpoint `overview`.

## UI y Performance
- **UI Polish:** Las cards de obligaciones y el resumen han sido ajustados para una apariencia más premium, humana y "calmada", removiendo badges técnicos y ruido visual, y ocultando estados irrelevantes.
- **Mensajes de Error:** Los errores financieros (ej. fondos insuficientes, periodos no pagables) están mapeados a descripciones amigables en español.
- **Rastros V1.7:** Toda mención de "V1.7" fue eliminada de los componentes visuales.
- **Performance de Carga Inicial:** La carga inicial se realiza ahora en el servidor (`page.tsx`) llamando en paralelo los endpoints requeridos (`overview`, `summary`, `accounts`), eliminando completamente la doble fase de carga en el cliente (no client initial fetch).
- **Performance de Refresh (Mutaciones):** Tras una mutación (pago, skip, etc.), se utiliza la acción consolidada `getObligationsScreenDataAction` que ejecuta las lecturas concurrentes, enviando todos los datos en un solo roundtrip al cliente en lugar de tres peticiones separadas, optimizando radicalmente el tiempo de refresh.
- **Loading UX:** Se implementó una pantalla skeleton nativa de Next.js (`loading.tsx`) para proporcionar transición fluida durante la precarga desde servidor.
- **React Strict Mode:** La duplicación innecesaria en el entorno de desarrollo fue suprimida al eliminar el `useEffect` de carga inicial.
- **N+1 Restricción:** Se mantiene la eliminación de regresiones de N+1 (los datos siempre provienen de los endpoints consolidados de la capa superior).

## QA
Todas las pruebas manuales (QA) han sido completadas por Steven sin regresiones identificadas.

## Pendientes / Mejoras Futuras
- Con la performance agregada a nivel de BFF/Server Actions (Next.js), crear un endpoint en backend `summary/screen` ya no es estrictamente necesario, aunque sigue siendo una posibilidad a futuro.

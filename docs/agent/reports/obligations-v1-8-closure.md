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
- **Performance:** La carga inicial se realiza con un fetch principal (`overview`) evitando fetches por obligación individual, eliminando regresiones de N+1. Nota: React Strict Mode puede duplicar las peticiones en el entorno de desarrollo local, pero esto no afecta producción.

## QA
Todas las pruebas manuales (QA) han sido completadas por Steven sin regresiones identificadas.

## Pendientes / Mejoras Futuras
- Posible refactorización en el backend/frontend para tener un endpoint unificado de screen (`summary/screen`) para reducir aún más las peticiones concurrentes iniciales.

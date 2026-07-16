# Sincronización Frontend: Categorías V1

Este documento describe la sincronización del frontend con el contrato de Categorías V1 expuesto por el backend.

**Objetivo de Categorías V1:** Establecer el catálogo dinámico de categorías globales y privadas para clasificar movimientos, ocultando las categorías de uso interno y asegurando consistencia transaccional.
**Backend baseline:** 6c28253
**Frontend commit:** 407cd7d
**Branch:** feat/frontend-init

## Contrato Final

- OpenAPI sincronizado con backend 6c28253.
- Tipos TypeScript regenerados.
- Wrappers del API cliente actualizados:
  - `archive` (POST `/api/v1/categories/{category_id}/archive`)
  - `restore` (POST `/api/v1/categories/{category_id}/restore`)
  - `reclassifyEvent` (POST `/api/v1/ledger/events/{event_id}/reclassify`)

## Catálogo Global y Privado

- Categorías globales visibles como solo lectura. No son editables ni archivables desde la UI.
- Categorías privadas creables y editables por el usuario.
- **Tipos Internos Ocultos:** Las categorías usadas por el sistema (`credit_card`, `goal`, `transfer`, `system`, `obligation`) están filtradas y ocultas para el usuario en los flujos manuales.
- **Fallbacks:** En caso de iconos desconocidos (`icon_key`), el frontend usa un fallback seguro y neutral (`📁`).

## New Entry (Creación de Movimientos)

- El formulario ahora consume el catálogo dinámico de `income` y `expense`.
- Filtra categorías archivadas y de uso interno.
- **Decisión de Producto - Orden:** Las categorías compatibles se ordenan alfabéticamente (español `localeCompare`). No hay separación estricta en el select entre globales y privadas; ambas comparten el ordenamiento alfabético.
- **Decisión de Producto - Sin clasificar:** Se usa la categoría global real (`expense_uncategorized` e `income_uncategorized`) posicionada obligatoriamente al final del selector. Al usarla, se envía su UUID real al backend.
- Se ha eliminado la opción local de formulario ("-- Sin categoría --").
- El componente `NewEntryClient` ahora muestra el **saldo actual de la cuenta** seleccionada (sin calcularlo en el frontend, usando el `balance` devuelto por `Accounts`).
- Idempotencia: `idempotency_key` (UUID v4) generada localmente. Persiste estable durante reintentos por red.

## Gestión de Categorías Privadas

- UI dividida lógicamente entre activas y archivadas (si aplica en vistas).
- `Archive` y `Restore` implementados exclusivamente vía endpoints POST dedicados, abandonando la práctica temporal de `PATCH is_active`.
- **No DELETE:** El endpoint de eliminación física de categorías nunca se expone en la UI.
- Nombres de categorías privadas similares semánticamente están permitidos (frontend no aplica fuzzy matching preventivo).

## Reclasificación en History

- Botón "Cambiar categoría" disponible en `/app/history` únicamente para `income` y `expense`.
- El payload envía `event.id` estrictamente.
- Categorías sugeridas están filtradas para coincidir con el tipo del movimiento original.
- Categoría actual excluida de las opciones seleccionables.
- Campo `reason` opcional (máximo 500 caracteres).
- Idempotencia controlada en el cliente; si el backend retorna estado de `idempotent_retry` u otro indicador de éxito seguro, se asume un éxito local para no bloquear la UI.
- Errores 409 y 422 expuestos humanamente.
- Tras éxito, el History refresca su caché (`revalidatePath`) para actualizar la UI inmediatamente conservando filtros.

## Validaciones Técnicas y QA

- **Typecheck:** Pasado exitosamente sin `any` sueltos.
- **Lint:** Pasado exitosamente.
- **Build:** Pasado exitosamente con App Router estático/dinámico.
- **QA Manual:** QA de Fundador completado y correcciones de UX iteradas.

## Limitaciones Actuales y Deuda Técnica

- Reclasificación de movimientos expuesta **únicamente en History**. Aún no implementada en `/app/accounts/[id]` (Account Detail).
- No hay un historial visual de las reclasificaciones (GET) en la interfaz actual (ej. ver cuándo y por qué cambió).
- No existe reclasificación masiva.
- Categoría "Deudas" (`expense_debt`) conservada en el catálogo general; su especialización futura requerirá revisión del modelo contable.

## Estado Final

- Frontend Sync Completado.
- No hay despliegue automático del frontend todavía.
- Trabajo validado en la rama `feat/frontend-init`.

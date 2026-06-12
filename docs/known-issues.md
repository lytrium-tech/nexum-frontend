# Problemas Conocidos y Tareas Pendientes (Frontend)

## 1. Categorías Iniciales (Onboarding)
- **Contexto:** El onboarding necesita un catálogo de categorías de respaldo temporal.
- **Pendiente:** Determinar si existe endpoint para crear categorías personalizadas, si el backend requiere IDs existentes, si el backend crea categorías base y cómo se persisten por usuario.
- **Acción a futuro:** Implementar un fallback visual de onboarding, o conectarse directamente a un eventual endpoint de categorías base en el backend.

## 2. Saldo Inicial
- **Contexto:** El usuario requiere configurar su saldo inicial durante el onboarding forzoso de primera billetera.
- **Pendiente:** Verificar si `POST /api/v1/accounts` soporta el establecimiento de un saldo inicial o si requiere llamadas secundarias (creación de transacción inicial o ajuste de capital).
- **Resolución Parcial (Fase 2):** Se confirmó que el contrato `AccountCreate` no soporta la propiedad `initial_balance`. La UI de onboarding actual omite este campo para no enviar requests erróneos ni falsificar ingresos. Se requiere una definición de backend sobre si se usará `POST /api/v1/cash/income` u otro endpoint para el balance inicial.

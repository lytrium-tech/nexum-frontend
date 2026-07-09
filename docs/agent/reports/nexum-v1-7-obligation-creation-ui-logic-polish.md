# Nexum V1.7 Obligation Creation UI Logic Polish

## Cambios de UI
- **Modal de Creación:**
  - Se implementó la lógica para ocultar la Frecuencia, el Tipo de Monto, y la Fecha de Inicio cuando se selecciona el tipo "Una vez".
  - Se implementó la validación para asegurar que se muestre "Monto" (como requerido) en "Una vez".
  - Se implementó la lógica para ocultar el "Monto base" cuando se selecciona el tipo de monto "Variable" y mostrar el texto informativo *"Definirás el monto de cada periodo cuando llegue el momento de pagarlo."*.
- **Cards/Listado de obligaciones:**
  - **Una vez:** Se muestra el label "Una vez" y oculta la frecuencia. Se muestra el label "Monto" en lugar de "Monto del Periodo".
  - **Recurrente Fija:** Se muestra el label de la frecuencia + Fija (ej. "Mensual • Fija"). Se muestra el label "Monto base".
  - **Recurrente Variable:** Se muestra el label de frecuencia + Variable. Si el monto está pendiente por definir, se muestra el texto "Monto por definir" en lugar de `$0` o `-`.

## Reglas "Una vez"
- Payload interno forzado a `frequency = 'one_time'`, `amount_type = 'fixed'`.
- `base_amount` es requerido. Validado que sea mayor a 0 en el frontend antes de enviar al backend.
- `start_date` asume el valor de `first_due_date` para consistencia del contrato.
- Visualmente: Solo se muestra Moneda, Monto, y Fecha de vencimiento.

## Reglas "Recurrente fija"
- Payload envía `amount_type = 'fixed'` y el `base_amount`.
- Validado que el `base_amount` sea mayor a 0.
- Visualmente: Se muestra Frecuencia, Tipo de monto, Moneda, Monto base, Fecha de inicio y Primer vencimiento.

## Reglas "Recurrente variable"
- Payload envía `amount_type = 'variable'` y omite el `base_amount`.
- Visualmente: Oculta el Monto base, muestra mensaje explicativo para el usuario.

## QA de creación
- Confirmado que las selecciones actualizan dinámicamente el modal y aplican las validaciones correctas sin dejar que el usuario seleccione estados inválidos.

## QA de cards
- Confirmado que las cards respetan los tipos `one_time`, `fixed`, `variable` y adaptan sus labels correctamente. Ocultan ceros engañosos en montos pendientes.

## QA de pagos
- Las lógicas de pagos COP -> COP, USD -> COP FX Snapshot, "Pagar saldo", y "Otro monto" continúan intactas y sin regresiones.

## Estado de FIFO
- Habiendo pulido la lógica de UI de las obligaciones, **FIFO puede desbloquearse** para su implementación en la próxima fase, ya que el estado base es sólido y consistente.

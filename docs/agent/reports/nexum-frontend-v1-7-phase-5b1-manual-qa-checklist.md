# Nexum Frontend V1.7 - Phase 5B.1 Manual QA Checklist

Esta gua de prueba manual debe ser completada antes de avanzar a la Fase 5B.2 (FIFO).

## Prerrequisitos
1. Asegrate de que el flag de V1.7 est activo en backend y que estés utilizando una versin compatible del backend (V1.7).
2. Activa el feature flag en el frontend. Abre el archivo `.env.local` en la raíz del frontend (o crea uno si no existe) y asegura:
   ```env
   NEXT_PUBLIC_NEXUM_OBLIGATIONS_V17_ENABLED=true
   ```
3. Reinicia el servidor de desarrollo del frontend:
   ```bash
   pnpm dev
   ```

## Checklist de Prueba de Pagos

### 1. Validacin Inicial
- [ ] Entra a `/app/obligations`.
- [ ] Verifica que el listado de obligaciones carga correctamente.
- [ ] Crea o identifica una obligación V1.7 que tenga un periodo pagable (estado: `pending_payment`, `partially_paid` u `overdue`).

### 2. Flujo de Pago Especfico (Primer Pago)
- [ ] Haz clic en **Pagar periodo**.
- [ ] Confirma que se abre el modal y muestra la lista de tus cuentas correctamente (nombre y saldo actual).
- [ ] Selecciona una cuenta con saldo en la misma moneda que la obligacin.
- [ ] Ingresa un monto parcial (ejemplo: `10000`).
- [ ] Haz clic en **Confirmar pago**.
- [ ] **Validacin Crtica**: Verifica que el modal se cierra, y que el estado de la obligacin (saldos, monto pagado, estado) **se actualiza inmediatamente en pantalla** sin necesidad de recargar la pgina.

### 3. Pagos Secuenciales (Segundo Pago)
- [ ] Con la misma obligacin, vuelve a abrir el modal de **Pagar periodo**.
- [ ] Selecciona una cuenta e ingresa otro monto parcial (ejemplo: `5000`).
- [ ] Haz clic en **Confirmar pago**.
- [ ] **Validacin Crtica**: Verifica que la UI actualiza inmediatamente.
- [ ] **Prevencin de Regresin**: Confirma que NO ocurre el bug histrico de V1.6:
  - El segundo pago suma correctamente y la obligacin no queda con el monto del primer pago únicamente.
  - La obligacin no queda `stale`.

### 4. Consistencia de Cuenta e Historial
- [ ] Si la UI del frontend tiene vistas para el historial de transacciones o el saldo de las cuentas, navega a estas secciones.
- [ ] Confirma que el pago aparece registrado en el historial.
- [ ] Confirma que la cuenta seleccionada ha descontado el monto correspondiente.
- [ ] *(Nota: Si la UI de V1.7 o el current build an no expone historial completo de transacciones visualmente, marca este punto como `NOT_TESTED_UI_UNAVAILABLE`).*

## Criterios de Aprobacin

* **PASSED**: Si todas las validaciones crticas se cumplen satisfactoriamente. Los pagos secuenciales actualizan el summary y el periodo inmediatamente tras consultar al backend, sin quedar stale.
* **FAILED**: Si la UI no refresca inmediatamente despus del pago, si se experimenta el bug del "stale data" en el segundo pago, o si el saldo/historial se desincroniza del estado de la obligacin.

*Nota para Steven: Una vez ejecutes estas pruebas y confirmes el estado `PASSED`, infrmame para avanzar formalmente a la implementacin del pago FIFO (Fase 5B.2).*

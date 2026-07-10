# Nexum Frontend — Obligations Closure

**Estado actual:** Módulo cerrado para V1.7/V1.8 y completamente operativo en frontend, sin feature flags experimentales.

## Resumen de Funcionalidades Implementadas

### 1. One-Button Payment & FIFO
- Interfaz simplificada con un único botón **[Pagar]** dinámico.
- Soporte nativo para elegir **"Pagar saldo"** (resto pendiente) o **"Otro monto"** (pago parcial).
- Los pagos se enrutan de manera transparente al endpoint `FIFO`, el cual abona la cantidad al saldo pendiente más antiguo automáticamente, evitando fricción y exposición técnica al usuario.

### 2. Multi-divisa y FX Rate Snapshot Bidireccional
- Funcionalidad real-time preview (cotización estimada en la interfaz) utilizando el endpoint `latest` cacheado.
- Soporta transferencias `COP -> USD` y `USD -> COP` utilizando el `rate_snapshot_id`.
- Se bloquean los pagos y se muestra aviso visual amigable en caso de que el backend reporte vencimiento de la cotización (`fx_rate_snapshot_expired`).

### 3. Montos Variables Requeridos
- Se implementó UX "Paso a Paso" para obligaciones recurrentes con monto variable.
- Si el periodo actual carece de monto definido, el sistema bloquea los pagos forzando al usuario a establecer el monto primero mediante el botón **[Definir monto]**. 

### 4. Ciclo de Vida de Cuotas (Skip/Cancel)
- Soporte total para descartar cuotas (`Skip`) o cancelarlas formalmente (`Cancel`) desde la UI.

### 5. Rendimiento y Seguridad (No N+1)
- Las listas y tarjetas de la interfaz se construyen ahora utilizando el endpoint unificado `overview`. 
- Se eliminó el anti-patrón de llamadas N+1 (`Promise.all(obligations.map(getPeriods))`), mejorando la latencia en la renderización inicial. (Nota: en entorno de desarrollo `Strict Mode` de React puede duplicar peticiones temporalmente de forma esperada).

## UI & UX Polish
- **Menos ruido, más financiero:** Ajuste de los *labels* de las cuotas. Reemplazamos insignias excesivas y jerga técnica por formatos claros como "Mensual • Fija", "Monto por definir", etc.
- **Tratamiento Humanizado de Errores:** Errores como `insufficient_funds` o periodos incompatibles están mapeados a explicaciones de usuario finales ("No tienes saldo suficiente en la cuenta seleccionada", "El monto supera el saldo pendiente de este periodo").
- Se quitaron las advertencias, labels temporales y fallbacks del sistema antiguo ("V1.7"). El sistema actual representa el estado por defecto de Nexum Obligations.

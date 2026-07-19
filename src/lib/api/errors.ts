export class ApiError extends Error {
  status: number;
  data: unknown;
  errorCode?: string;

  constructor(message: string, status: number, data?: unknown, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errorCode = errorCode;
  }
}

export function handleFinancialError(err: unknown, defaultMessage: string = 'Ocurrió un error. Intenta nuevamente.'): string {
  if (err instanceof ApiError) {
    const status = err.status;
    const backendMsg = (err.message || '').toLowerCase();
    const errorCode = (err.errorCode || '').toLowerCase();
    
    // Log explicit pattern if needed (already logged in actions typically, but good practice)
    
    // Network / fetch error (we map fetch failure to status 0 in apiClient)
    if (status === 0) return 'No pudimos conectar con Nexum. Inténtalo de nuevo.';
    
    // 500/backend error
    if (status >= 500) return 'Nexum no pudo procesar esta operación en este momento.';

    // Explicit unsupported currency (Do not map generic 403 to this)
    if (
      errorCode === 'unsupported_currency' ||
      backendMsg.includes('unsupported currency') ||
      backendMsg.includes('unsupported fx') ||
      backendMsg.includes('currency not supported') ||
      backendMsg.includes('fx pair not supported')
    ) {
      return 'Por ahora Nexum solo soporta conversiones COP/USD.';
    }

    // Explicit mappings from V1.6.2 constraints
    if (errorCode === 'insufficient_funds' || backendMsg.includes('insufficient funds')) {
      return 'No tienes saldo suficiente en la cuenta seleccionada.';
    }

    // Transfers V1 and FX
    if (errorCode === 'same_account') return 'Selecciona dos cuentas diferentes.';
    if (errorCode === 'source_account_not_found') return 'La cuenta de origen ya no está disponible.';
    if (errorCode === 'destination_account_not_found') return 'La cuenta de destino ya no está disponible.';
    if (errorCode === 'source_account_inactive') return 'La cuenta de origen está inactiva.';
    if (errorCode === 'destination_account_inactive') return 'La cuenta de destino está inactiva.';
    if (errorCode === 'account_balance_invalid') return 'El saldo de la cuenta no es válido.';
    if (errorCode === 'idempotency_key_reused') return 'Esta operación ya fue procesada o hubo un conflicto. Inténtalo de nuevo.';
    if (errorCode === 'transfer_integrity_conflict') return 'Hubo un problema de consistencia. Por favor, recarga la página.';
    if (errorCode === 'fx_rate_snapshot_required') return 'Esta transferencia requiere una tasa de cambio válida.';
    if (errorCode === 'fx_rate_snapshot_not_allowed') return 'No se requiere tasa de cambio para transferencias en la misma moneda.';
    if (errorCode === 'invalid_fx_rate_snapshot') return 'La tasa de cambio seleccionada no es válida.';
    if (errorCode === 'fx_rate_snapshot_expired') return 'La tasa de cambio expiró. Actualízala antes de continuar.';
    if (errorCode === 'fx_rate_snapshot_stale') return 'La tasa de cambio ya no está vigente.';
    if (errorCode === 'currency_pair_mismatch') return 'La tasa seleccionada no corresponde a estas monedas.';
    if (errorCode === 'invalid_fx_rate') return 'La tasa de cambio provista tiene un error.';
    if (errorCode === 'cross_currency_overflow') return 'El monto supera el límite de conversión.';
    if (errorCode === 'cross_currency_underflow') return 'El monto convertido es demasiado bajo para procesar.';
    if (errorCode === 'unsupported_currency_pair' || backendMsg.includes('unsupported currency')) {
      return 'Nexum todavía no puede convertir entre estas monedas.';
    }
    if (errorCode === 'obligation_period_not_payable' || backendMsg.includes('not payable')) {
      return 'Este periodo no permite pagos.';
    }
    if (errorCode === 'account_not_found' || backendMsg.includes('account not found')) {
      return 'No encontramos esta cuenta.';
    }
    if (errorCode === 'obligation_period_not_found' || backendMsg.includes('period not found')) {
      return 'No encontramos este periodo.';
    }
    if (errorCode === 'obligation_payment_exceeds_remaining_balance' || backendMsg.includes('overpayment') || backendMsg.includes('supera el saldo')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataObj = err.data as any;
      if (dataObj && dataObj.remaining_amount !== undefined && dataObj.currency) {
        return `El monto supera el saldo pendiente de este periodo. Puedes pagar hasta ${dataObj.remaining_amount} ${dataObj.currency}.`;
      }
      return 'El monto supera el saldo pendiente de este periodo.';
    }

    // Additional helpful mappings from current behavior
    if (backendMsg.includes('match') && backendMsg.includes('quota')) return 'El pago debe coincidir exactamente con el valor de la obligación.';
    if (backendMsg.includes('already paid') || backendMsg.includes('paid for this period')) return 'Esta obligación ya fue pagada para este periodo.';
    if (backendMsg.includes('greater than 0')) return 'El monto debe ser mayor a $0.';
    if (status === 409 && backendMsg.includes('exist')) return 'Ya existe un elemento con este nombre o características.';

    // Unauthorized / forbidden generic
    if (status === 401 || status === 403) return 'No tienes permiso para realizar esta acción.';
    
    // Validation error
    if (status === 422) {
      if (err.message && err.message !== 'Error de validación' && !err.message.includes('{}') && err.message !== 'Ocurrió un error inesperado') {
        return err.message;
      }
      return 'Revisa los datos e inténtalo de nuevo.';
    }

    if (err.message && err.message !== 'Ocurrió un error inesperado' && err.message !== 'Acceso denegado' && !err.message.includes('{}')) {
      return err.message;
    }
  }
  
  return defaultMessage;
}

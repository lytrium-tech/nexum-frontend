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

    // Explicit mappings
    if (backendMsg.includes('insufficient funds') || backendMsg.includes('fondos') || backendMsg.includes('balance')) return 'Saldo insuficiente en la cuenta seleccionada.';
    if (backendMsg.includes('account not found') || backendMsg.includes('invalid account')) return 'Selecciona una cuenta válida.';
    if (backendMsg.includes('goal not found')) return 'No encontramos esta meta.';
    if (backendMsg.includes('obligation not found')) return 'No encontramos esta obligación.';
    if (backendMsg.includes('credit card not found') || backendMsg.includes('card not found')) return 'No encontramos esta tarjeta.';
    if (backendMsg.includes('purchase not found')) return 'No encontramos esta compra.';
    if (backendMsg.includes('not eligible')) return 'Esta acción no está disponible para este elemento.';
    if (backendMsg.includes('statement frozen') || backendMsg.includes('frozen') || backendMsg.includes('cerrado')) return 'Este periodo ya está cerrado y no puede modificarse.';
    if (backendMsg.includes('overpayment') || backendMsg.includes('supera el saldo')) return 'El pago supera el saldo pendiente permitido.';
    
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

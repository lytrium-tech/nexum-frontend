export function formatLedgerAmount({
  amount,
  currency,
  direction,
  eventType
}: {
  amount: string | number | null | undefined;
  currency?: string | null;
  direction?: string | null;
  eventType?: string | null;
}): string {
  if (amount == null || amount === '') return '—';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';

  const absNum = Math.abs(num);

  const normalizedDirection = direction?.toLowerCase();
  const normalizedType = eventType?.toLowerCase();
  
  let sign = '';
  
  if (normalizedDirection === 'in' || normalizedDirection === 'inflow') {
    sign = '+';
  } else if (normalizedDirection === 'out' || normalizedDirection === 'outflow') {
    sign = '-';
  } else {
    // Si direction falta y no es opening_balance, se deja neutral
    if (normalizedType === 'opening_balance') {
      sign = '+';
    } else {
      sign = '';
    }
  }

  if (!currency) {
    return `${sign}${absNum}`;
  }

  const isWholeCurrency = currency.toUpperCase() === 'COP';
  const digits = isWholeCurrency ? 0 : 2;

  const formattedAbs = new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(absNum);

  return `${sign}${formattedAbs}`;
}

export function getLedgerEventName(eventType: string | null | undefined): string {
  if (!eventType) return 'Desconocido';
  const mapper: Record<string, string> = {
    income: 'Ingreso',
    expense: 'Gasto',
    transfer_in: 'Transferencia recibida',
    transfer_out: 'Transferencia enviada',
    goal_contribution: 'Aporte a meta',
    obligation_payment: 'Pago de obligación',
    credit_card_purchase: 'Compra con tarjeta',
    credit_card_payment: 'Pago de tarjeta',
    opening_balance: 'Saldo inicial',
    balance_adjustment: 'Ajuste de saldo',
    manual_adjustment: 'Ajuste manual'
  };
  return mapper[eventType.toLowerCase()] || eventType.replace(/_/g, ' ') || 'Desconocido';
}

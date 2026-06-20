export function formatLedgerAmount({
  amount,
  currency = 'COP',
  direction,
  eventType
}: {
  amount: string | number;
  currency?: string;
  direction?: string;
  eventType?: string;
}): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0';

  const absNum = Math.abs(num);

  // Normalize direction to lowercase to avoid IN vs in issues
  const normalizedDirection = direction?.toLowerCase();
  
  let isPositive = false;
  
  if (normalizedDirection === 'in' || normalizedDirection === 'inflow') {
    isPositive = true;
  } else if (normalizedDirection === 'out' || normalizedDirection === 'outflow') {
    isPositive = false;
  } else {
    // Fallback based on eventType
    const normalizedType = eventType?.toLowerCase();
    if (normalizedType === 'income' || normalizedType === 'transfer_in' || normalizedType === 'opening_balance') {
      isPositive = true;
    } else {
      isPositive = false;
    }
  }

  const sign = isPositive ? '+' : '-';
  const formattedAbs = new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: 0 
  }).format(absNum);

  return `${sign}${formattedAbs}`;
}

export function getLedgerEventName(eventType: string): string {
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
    balance_adjustment: 'Ajuste de saldo'
  };
  return mapper[eventType?.toLowerCase()] || eventType?.replace(/_/g, ' ') || 'Desconocido';
}

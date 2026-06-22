export function formatMoneyOrDash(amount: string | number | null | undefined, currency: string = 'COP'): string {
  if (amount == null || amount === '') return '—';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';

  const isWholeCurrency = currency === 'COP';
  const digits = isWholeCurrency ? 0 : 2;

  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: currency || 'COP', 
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(num);
}

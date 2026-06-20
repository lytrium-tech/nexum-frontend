export function formatMoneyOrDash(amount: string | number | null | undefined, currency: string = 'COP'): string {
  if (amount == null || amount === '') return '—';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';

  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: currency || 'COP', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

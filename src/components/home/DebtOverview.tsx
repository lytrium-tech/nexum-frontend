import React from 'react';

interface DebtOverviewProps {
  creditCardDebt: string;
  creditCardRequiredPayment: string;
}

export default function DebtOverview({ creditCardDebt, creditCardRequiredPayment }: DebtOverviewProps) {
  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
  };

  const hasDebt = parseFloat(creditCardDebt) > 0;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
      <h3 className="text-base font-semibold text-graphite-blue mb-5">Deuda</h3>
      
      {!hasDebt ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-400">No tienes deudas reportadas en este momento.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-xs text-gray-500 mb-1">Deuda Total de Tarjetas</p>
            <p className="text-xl font-semibold text-graphite-blue">{formatCurrency(creditCardDebt)}</p>
          </div>
          
          <div className="bg-warm-white p-4 rounded-2xl">
            <p className="text-xs text-gray-500 mb-1">Pago Requerido</p>
            <p className="text-lg font-semibold text-red-500">{formatCurrency(creditCardRequiredPayment)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Estimado a pagar este periodo</p>
          </div>
        </div>
      )}
    </div>
  );
}

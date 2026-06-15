import React from 'react';

interface FinancialHeroProps {
  availableReal: string;
  safeMoney: string;
  freeMoney: string;
  currency?: string;
  period?: string;
}

export default function FinancialHero({ availableReal, safeMoney, freeMoney, currency = 'COP', period = 'Mes actual' }: FinancialHeroProps) {
  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="bg-graphite-blue p-6 rounded-3xl shadow-sm text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-medium text-white/70">Financial Vitality</h2>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/90">{period}</span>
        </div>

        <div className="mb-8">
          <p className="text-sm text-white/70 mb-1">Disponible Real</p>
          <p className="text-4xl md:text-5xl font-semibold tracking-tight text-champagne-gold">
            {formatCurrency(availableReal)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs text-white/60 mb-1">Dinero Seguro</p>
            <p className="text-lg font-medium">{formatCurrency(safeMoney)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Dinero Libre</p>
            <p className="text-lg font-medium">{formatCurrency(freeMoney)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

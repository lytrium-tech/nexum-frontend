import React from 'react';
import { formatMoneyOrDash } from '@/lib/format/money';
import { components } from '@/lib/api/types.generated';

interface FinancialHeroProps {
  availableReal: string;
  safeMoney: string;
  freeMoney: string;
  warnings?: string[];
  currency?: string;
  period?: string;
  totalsByCurrency?: { [key: string]: components['schemas']['CurrencyMetrics'] };
}

export default function FinancialHero({ 
  availableReal, 
  safeMoney, 
  freeMoney, 
  warnings, 
  currency = 'COP', 
  period = 'Mes actual',
  totalsByCurrency
}: FinancialHeroProps) {

  const hasMultipleCurrencies = totalsByCurrency && Object.keys(totalsByCurrency).length > 1;

  return (
    <div className="bg-graphite-blue p-6 rounded-3xl shadow-sm text-white relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      
      <div className="relative z-10 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-medium text-white/70">Vitalidad Financiera</h2>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/90">{period}</span>
        </div>

        <div className="mb-8">
          <p className="text-sm text-white/70 mb-1">Disponible Real</p>
          <p className="text-4xl md:text-5xl font-semibold tracking-tight text-champagne-gold">
            {formatMoneyOrDash(availableReal, currency)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs text-white/60 mb-1">Dinero Seguro</p>
            <p className="text-lg font-medium">{formatMoneyOrDash(safeMoney, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Dinero Libre</p>
            <p className="text-lg font-medium">{formatMoneyOrDash(freeMoney, currency)}</p>
          </div>
        </div>

        {hasMultipleCurrencies && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Saldos por moneda</p>
            <div className="space-y-2">
              {Object.entries(totalsByCurrency).map(([curr, metrics]) => (
                <div key={curr} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/90 w-10">{curr}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-champagne-gold">{formatMoneyOrDash(metrics.available_real, curr)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings && warnings.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {warnings[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

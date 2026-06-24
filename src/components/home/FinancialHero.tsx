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
  estimatedTotals?: components['schemas']['EstimatedTotals'] | null;
}

export default function FinancialHero({ 
  availableReal, 
  safeMoney, 
  freeMoney, 
  warnings, 
  currency = 'COP', 
  period = 'Mes actual',
  totalsByCurrency,
  estimatedTotals
}: FinancialHeroProps) {

  const isTotalsArray = Array.isArray(totalsByCurrency);
  const totalsList = isTotalsArray 
    ? totalsByCurrency 
    : (totalsByCurrency ? Object.entries(totalsByCurrency).map(([curr, metrics]) => ({ currency: curr, ...(metrics as object) })) : []);

  const hasWarning = warnings?.includes('cross_currency_global_totals_disabled') || false;
  const hasMultipleCurrencies = hasWarning || totalsList.length > 1;

  const displayWarnings = warnings?.filter(w => w !== 'cross_currency_global_totals_disabled') || [];

  return (
    <div className="bg-graphite-blue p-6 rounded-3xl shadow-sm text-white relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      
      <div className="relative z-10 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-medium text-white/70">Vitalidad Financiera</h2>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/90">{period}</span>
        </div>

        {!hasMultipleCurrencies && (
          <>
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
          </>
        )}

        {hasMultipleCurrencies && (
          <div className="mt-2 border-white/10 pt-2">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Saldos por moneda</p>
            <div className="space-y-2">
              {totalsList.map((item: { currency: string; available_real?: string }) => (
                <div key={item.currency} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/90 w-10">{item.currency}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-champagne-gold font-medium">{formatMoneyOrDash(item.available_real || '0', item.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
            {hasWarning && !estimatedTotals && (
              <p className="text-[10px] text-white/40 mt-4 italic">
                Totales separados por moneda
              </p>
            )}

            {estimatedTotals && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/60 mb-1 flex items-center justify-between">
                  <span>Total Estimado en {estimatedTotals.base_currency}</span>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium">Estimado</span>
                </p>
                <p className="text-2xl font-semibold tracking-tight text-champagne-gold">
                  {formatMoneyOrDash(estimatedTotals.estimated_total_base_currency, estimatedTotals.base_currency)}
                </p>
                
                {estimatedTotals.unsupported_currencies && estimatedTotals.unsupported_currencies.length > 0 && (
                  <p className="text-[10px] text-orange-300/80 mt-1.5 flex items-start gap-1">
                    <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Excluye monedas sin tasa de cambio ({estimatedTotals.unsupported_currencies.join(', ')})</span>
                  </p>
                )}
                <p className="text-[9px] text-white/30 mt-1.5">
                  Tasas ref. {estimatedTotals.rate_source} ({new Date(estimatedTotals.rate_timestamp).toLocaleDateString()})
                </p>
              </div>
            )}
          </div>
        )}

        {displayWarnings.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {displayWarnings[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { formatMoneyOrDash } from '@/lib/format/money';

interface CashflowSummaryProps {
  incomeCurrentPeriod: string;
  cashExpensesCurrentPeriod: string;
  creditCardConsumptionCurrentPeriod: string;
  debtPaymentsCurrentPeriod: string;
  goalContributionsCurrentPeriod: string;
  obligationPaymentsCurrentPeriod: string;
  committedOutflowCurrentPeriod: string;
  netCashflowCurrentPeriod: string;
}

export default function CashflowSummary({ 
  incomeCurrentPeriod, 
  cashExpensesCurrentPeriod, 
  creditCardConsumptionCurrentPeriod,
  debtPaymentsCurrentPeriod,
  goalContributionsCurrentPeriod,
  obligationPaymentsCurrentPeriod,
  committedOutflowCurrentPeriod,
  netCashflowCurrentPeriod 
}: CashflowSummaryProps) {
  
  const isNetPositive = netCashflowCurrentPeriod !== '—' && parseFloat(netCashflowCurrentPeriod) >= 0;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray flex flex-col justify-between">
      <h3 className="text-base font-semibold text-graphite-blue mb-5">Flujo de Caja (Este Período)</h3>
      
      <div className="space-y-4 flex-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sage-green"></div>
            <span className="text-sm text-gray-500 font-medium">Ingresos</span>
          </div>
          <span className="text-sm font-semibold text-graphite-blue">{formatMoneyOrDash(incomeCurrentPeriod)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span className="text-sm text-gray-500 font-medium">Gastos Efectivos</span>
          </div>
          <span className="text-sm font-semibold text-graphite-blue">{formatMoneyOrDash(cashExpensesCurrentPeriod)}</span>
        </div>

        {parseFloat(creditCardConsumptionCurrentPeriod) > 0 && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
              <span className="text-sm text-gray-500 font-medium">Consumo T. Crédito</span>
            </div>
            <span className="text-sm font-semibold text-graphite-blue">{formatMoneyOrDash(creditCardConsumptionCurrentPeriod)}</span>
          </div>
        )}

        {parseFloat(debtPaymentsCurrentPeriod) > 0 && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-sm text-gray-500 font-medium">Pago a Deuda</span>
            </div>
            <span className="text-sm font-semibold text-graphite-blue">{formatMoneyOrDash(debtPaymentsCurrentPeriod)}</span>
          </div>
        )}

        {parseFloat(goalContributionsCurrentPeriod) > 0 && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-sm text-gray-500 font-medium">Ahorro en Metas</span>
            </div>
            <span className="text-sm font-semibold text-graphite-blue">{formatMoneyOrDash(goalContributionsCurrentPeriod)}</span>
          </div>
        )}

        {parseFloat(obligationPaymentsCurrentPeriod) > 0 && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-sm text-gray-500 font-medium">Pago de Obligaciones</span>
            </div>
            <span className="text-sm font-semibold text-graphite-blue">{formatMoneyOrDash(obligationPaymentsCurrentPeriod)}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <span className="text-sm text-gray-500 font-medium">Salidas Comprometidas (Futuro)</span>
          </div>
          <span className="text-sm font-semibold text-graphite-blue">{formatMoneyOrDash(committedOutflowCurrentPeriod)}</span>
        </div>

        <div className="border-t border-soft-gray pt-4 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-500">Neto del Período</span>
            <span className={`text-sm font-semibold ${netCashflowCurrentPeriod === '—' ? 'text-gray-500' : isNetPositive ? 'text-sage-green' : 'text-red-500'}`}>
              {formatMoneyOrDash(netCashflowCurrentPeriod)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

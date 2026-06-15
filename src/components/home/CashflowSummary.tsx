import React from 'react';

interface CashflowSummaryProps {
  income: string;
  cashOutflow: string;
  committedOutflow: string;
}

export default function CashflowSummary({ income, cashOutflow, committedOutflow }: CashflowSummaryProps) {
  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
  };

  const incomeNum = parseFloat(income) || 0;
  const cashOutNum = parseFloat(cashOutflow) || 0;
  const committedOutNum = parseFloat(committedOutflow) || 0;
  const totalOutflow = cashOutNum + committedOutNum;
  const balance = incomeNum - totalOutflow;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
      <h3 className="text-base font-semibold text-graphite-blue mb-5">Resumen de Cashflow</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sage-green"></div>
            <span className="text-sm text-gray-500 font-medium">Ingresos</span>
          </div>
          <span className="text-sm font-semibold text-graphite-blue">{formatCurrency(income)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span className="text-sm text-gray-500 font-medium">Gastos Efectivos</span>
          </div>
          <span className="text-sm font-semibold text-graphite-blue">{formatCurrency(cashOutflow)}</span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <span className="text-sm text-gray-500 font-medium">Salidas Comprometidas</span>
          </div>
          <span className="text-sm font-semibold text-graphite-blue">{formatCurrency(committedOutflow)}</span>
        </div>

        <div className="border-t border-soft-gray pt-4 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-500">Balance Neto</span>
            <span className={`text-sm font-semibold ${balance >= 0 ? 'text-sage-green' : 'text-red-500'}`}>
              {formatCurrency(balance.toString())}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

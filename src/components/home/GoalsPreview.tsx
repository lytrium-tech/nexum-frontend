import React from 'react';

interface GoalsPreviewProps {
  wealthAllocation: string;
  goalsRequired: string;
}

export default function GoalsPreview({ wealthAllocation, goalsRequired }: GoalsPreviewProps) {
  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
  };

  const required = parseFloat(goalsRequired) || 0;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
      <h3 className="text-base font-semibold text-graphite-blue mb-5">Metas y Ahorro</h3>
      
      {required === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-400">No tienes metas activas para este periodo.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-xs text-gray-500 mb-1">Objetivo total de metas</p>
            <p className="text-xl font-semibold text-graphite-blue">{formatCurrency(goalsRequired)}</p>
            <p className="text-[10px] text-gray-400 mt-1">
              El requerido mensual se muestra dentro de cada meta con fecha.
            </p>
          </div>
          
          <div className="bg-warm-white p-4 rounded-2xl">
            <p className="text-xs text-gray-500 mb-1">Asignación Actual</p>
            <p className="text-lg font-semibold text-sage-green">{formatCurrency(wealthAllocation)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

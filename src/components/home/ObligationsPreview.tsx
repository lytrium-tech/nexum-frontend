import React from 'react';

interface ObligationsPreviewProps {
  pendingObligationsTotal: string;
}

export default function ObligationsPreview({ pendingObligationsTotal }: ObligationsPreviewProps) {
  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
  };

  const hasObligations = parseFloat(pendingObligationsTotal) > 0;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
      <h3 className="text-base font-semibold text-graphite-blue mb-5">Obligaciones Pendientes</h3>
      
      {!hasObligations ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-400">Todo al día. No tienes obligaciones pendientes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-warm-white p-4 rounded-2xl">
            <span className="text-sm text-gray-500 font-medium">Total Pendiente</span>
            <span className="text-lg font-semibold text-orange-400">{formatCurrency(pendingObligationsTotal)}</span>
          </div>
          <p className="text-xs text-gray-400 text-center">Revisa tus obligaciones detalladas en la sección correspondiente.</p>
        </div>
      )}
    </div>
  );
}

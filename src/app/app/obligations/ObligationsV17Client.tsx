'use client';

import React, { useState, useEffect } from 'react';
import { components } from '@/lib/api/types.generated';
import { formatMoneyOrDash } from '@/lib/format/money';
import { listObligationsV17Action, getObligationsSummaryV17Action } from './v17-actions';

type ObligationV17Response = components['schemas']['ObligationV17Response'];
type ObligationsV17SummaryResponse = components['schemas']['ObligationsV17SummaryResponse'];

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending_amount_definition: 'Monto por definir',
    pending_payment: 'Pendiente',
    partially_paid: 'Parcial',
    paid: 'Pagada',
    overdue: 'Vencida',
    skipped: 'Saltada',
    cancelled: 'Cancelada',
  };
  return map[status] || status;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'overdue': return 'text-red-700 bg-red-50 border-red-200';
    case 'paid': return 'text-green-700 bg-green-50 border-green-200';
    case 'partially_paid': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'pending_payment': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'pending_amount_definition':
    case 'skipped':
    case 'cancelled':
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

function getPaymentModeLabel(mode: string) {
  const map: Record<string, string> = {
    fixed: 'Fija',
    partial_allowed: 'Fija',
    fixed_full_payment: 'Fija',
    variable: 'Variable',
    variable_amount: 'Variable',
  };
  return map[mode] || mode;
}

export default function ObligationsV17Client() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [obligations, setObligations] = useState<ObligationV17Response[]>([]);
  const [summary, setSummary] = useState<ObligationsV17SummaryResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      try {
        setLoading(true);
        const [listRes, summaryRes] = await Promise.all([
          listObligationsV17Action(),
          getObligationsSummaryV17Action()
        ]);
        
        if (!mounted) return;

        if (!listRes.success) {
          setError(listRes.error || 'No pudimos cargar Obligaciones V1.7.');
          return;
        }

        if (!summaryRes.success) {
          setError(summaryRes.error || 'No pudimos cargar Obligaciones V1.7.');
          return;
        }

        setObligations(listRes.result || []);
        setSummary(summaryRes.result || null);
        
      } catch (e) {
        console.error(e);
        if (mounted) setError('No pudimos cargar Obligaciones V1.7.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6 sm:p-8 flex h-[50vh] flex-col items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-graphite-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6 sm:p-8">
        <div className="rounded-2xl bg-red-50 p-6 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-graphite-blue sm:text-3xl">
            Obligaciones (V1.7)
          </h1>
          <p className="mt-2 text-sm text-graphite-blue/60 sm:text-base">
            Controla tus compromisos y pagos pendientes.
          </p>
        </div>
        {/* Buttons are hidden in Phase 4 read-only UI */}
      </div>

      {summary && (
        <div className="mb-8 bg-white rounded-3xl border border-graphite-blue/10 shadow-sm p-6 overflow-hidden">
          <h2 className="text-lg font-semibold text-graphite-blue mb-4">Resumen del mes</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Totales por moneda */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Totales por moneda</h3>
              {summary.totals_by_currency && summary.totals_by_currency.length > 0 ? (
                <div className="space-y-3">
                  {summary.totals_by_currency.map((totals) => (
                    <div key={totals.currency} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-graphite-blue">{totals.currency}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Pendiente:</span>
                        <span className="font-medium text-amber-600">{formatMoneyOrDash(totals.pending_amount, totals.currency)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Vencido:</span>
                        <span className="font-medium text-red-600">{formatMoneyOrDash(totals.overdue_amount, totals.currency)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Pagado:</span>
                        <span className="font-medium text-green-600">{formatMoneyOrDash(totals.paid_amount, totals.currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </div>

            {/* Status Breakdown */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Estados</h3>
              {summary.status_counts && Object.keys(summary.status_counts).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(summary.status_counts).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                      <span className="text-sm font-medium text-gray-600">{count as number}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </div>

            {/* Action Required */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Requiere acción</h3>
              {summary.requires_action && summary.requires_action.length > 0 ? (
                <div className="space-y-2">
                  {summary.requires_action.map((action, i) => (
                    <div key={i} className="flex flex-col bg-amber-50 border border-amber-100 p-2 rounded-lg">
                      <span className="text-xs font-semibold text-amber-700 truncate">{action.name}</span>
                      <span className="text-xs text-amber-600">{getStatusLabel(action.reason)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Todo al día</p>
              )}
            </div>
          </div>
        </div>
      )}

      {obligations.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-2xl text-gray-500">
          Aún no tienes obligaciones registradas.
        </div>
      ) : (
        <div className="space-y-6">
          {obligations.map(ob => {
            return (
              <div key={ob.id} className="bg-white rounded-3xl border border-graphite-blue/10 shadow-sm p-6 overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-graphite-blue">{ob.name}</h2>
                  <p className="text-sm text-graphite-blue/60 mt-1 capitalize">
                    {ob.frequency.replace('_', ' ')} • {ob.amount_type ? getPaymentModeLabel(ob.amount_type) : '—'} • {ob.currency}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-2 text-right">
                  {ob.status ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block text-center w-fit ${getStatusColor(ob.status)}`}>
                      {getStatusLabel(ob.status)}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                  
                  {ob.amount !== undefined ? (
                    <p className="text-lg font-semibold text-graphite-blue">
                      {formatMoneyOrDash(ob.amount, ob.currency)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">—</p>
                  )}
                  
                  <p className="text-sm text-gray-400">—</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

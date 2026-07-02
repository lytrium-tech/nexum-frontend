'use client';

import React, { useState, useEffect } from 'react';
import { components } from '@/lib/api/types.generated';
import { formatMoneyOrDash } from '@/lib/format/money';
import { getObligationPeriodsAction, syncObligationPeriodsAction } from './actions';

type ObligationRead = components['schemas']['ObligationRead'];
type AccountRead = components['schemas']['AccountRead'];
type ObligationPeriodRead = components['schemas']['ObligationPeriodRead'];

interface ObligationsClientProps {
  initialObligations: ObligationRead[];
  accounts: AccountRead[];
}

function getRelevantPeriod(periods: ObligationPeriodRead[]): ObligationPeriodRead | null {
  if (!periods || periods.length === 0) return null;
  // 1. Primer periodo con status overdue
  const overdue = periods.find(p => p.status === 'overdue');
  if (overdue) return overdue;

  // 2. Primer periodo con status pending_amount_definition
  const pendingAmount = periods.find(p => p.status === 'pending_amount_definition');
  if (pendingAmount) return pendingAmount;

  // 3. Primer periodo con status pending_payment
  const pendingPayment = periods.find(p => p.status === 'pending_payment');
  if (pendingPayment) return pendingPayment;

  // 4. Primer periodo con status partially_paid
  const partiallyPaid = periods.find(p => p.status === 'partially_paid');
  if (partiallyPaid) return partiallyPaid;

  // 5. Primer periodo futuro/no cerrado
  const unclosed = periods.find(p => !['paid', 'skipped', 'cancelled'].includes(p.status));
  if (unclosed) return unclosed;

  // 6. Último periodo si todos están paid/skipped/cancelled
  return periods[periods.length - 1];
}

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
    case 'pending_amount_definition': return 'text-purple-700 bg-purple-50 border-purple-200';
    case 'pending_payment': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'skipped':
    case 'cancelled':
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export default function ObligationsClient({ initialObligations }: ObligationsClientProps) {
  const [periodsByObligation, setPeriodsByObligation] = useState<Record<string, ObligationPeriodRead[]>>({});
  const [loading, setLoading] = useState(initialObligations.length > 0);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    async function fetchPeriods() {
      try {
        const results: Record<string, ObligationPeriodRead[]> = {};
        for (const ob of initialObligations) {
           const res = await getObligationPeriodsAction(ob.id);
           if (res.success && res.result) {
              results[ob.id] = res.result;
           }
        }
        if (mounted) setPeriodsByObligation(results);
      } catch (e) {
        console.error(e);
        if (mounted) setError('No pudimos cargar tus obligaciones.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (initialObligations.length > 0) {
      fetchPeriods();
    }

    return () => { mounted = false; };
  }, [initialObligations]);

  const handleSync = async (obligationId: string) => {
    setSyncing(prev => ({ ...prev, [obligationId]: true }));
    try {
      const res = await syncObligationPeriodsAction(obligationId);
      if (res.success && res.result) {
        setPeriodsByObligation(prev => ({ ...prev, [obligationId]: res.result }));
      } else if (res.error) {
        // Just log the error, the UI is read-only right now
        console.error(res.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(prev => ({ ...prev, [obligationId]: false }));
    }
  };

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-graphite-blue sm:text-3xl">
          Obligaciones
        </h1>
        <p className="mt-2 text-sm text-graphite-blue/60 sm:text-base">
          Controla tus compromisos y pagos pendientes.
        </p>
      </div>

      {initialObligations.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-2xl text-gray-500">
          Aún no tienes obligaciones registradas.
        </div>
      ) : (
        <div className="space-y-6">
          {initialObligations.map(ob => {
            const periods = periodsByObligation[ob.id] || [];
            const period = getRelevantPeriod(periods);

            return (
              <div key={ob.id} className="bg-white rounded-3xl border border-graphite-blue/10 shadow-sm p-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-graphite-blue">{ob.name}</h2>
                    <p className="text-sm text-graphite-blue/60 mt-1 capitalize">
                      {ob.frequency.replace('_', ' ')} • {ob.payment_mode.replace('_', ' ')} • {ob.currency}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSync(ob.id)}
                    disabled={syncing[ob.id]}
                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {syncing[ob.id] ? 'Sincronizando...' : 'Sincronizar periodos'}
                  </button>
                </div>

                {!period ? (
                  <div className="bg-gray-50 rounded-2xl p-4 text-center text-sm text-gray-500">
                    Esta obligación aún no tiene periodos generados.
                  </div>
                ) : (
                  <div className="bg-gray-50/50 rounded-2xl p-5 border border-graphite-blue/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Periodo Actual</p>
                        <p className="text-sm font-medium text-graphite-blue">
                          Vence: {period.due_date ? new Date(period.due_date + 'T00:00:00').toLocaleDateString('es-CO', { timeZone: 'UTC' }) : 'No definida'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block text-center w-fit ${getStatusColor(period.status)}`}>
                        {getStatusLabel(period.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 mb-1">Monto del Periodo</p>
                        <p className="text-lg font-semibold text-graphite-blue">
                          {formatMoneyOrDash(period.amount, period.currency)}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 mb-1">Restante</p>
                        <p className="text-lg font-semibold text-graphite-blue">
                          {formatMoneyOrDash((period as any).remaining_amount, period.currency)}
                        </p>
                      </div>
                    </div>

                    {parseFloat(period.paid_amount || '0') > 0 && (
                      <div className="mt-3 text-right">
                        <p className="text-sm text-gray-500">
                          Pagado: <span className="font-medium text-graphite-blue">{formatMoneyOrDash(period.paid_amount, period.currency)}</span>
                        </p>
                      </div>
                    )}

                    <div className="mt-5 pt-5 border-t border-gray-100 flex justify-end">
                      {period.status === 'pending_amount_definition' ? (
                        <button disabled className="bg-gray-100/80 text-gray-400 px-5 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed w-full sm:w-auto">
                          Definir monto próximamente
                        </button>
                      ) : (period.status === 'pending_payment' || period.status === 'partially_paid' || period.status === 'overdue') ? (
                        <button disabled className="bg-gray-100/80 text-gray-400 px-5 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed w-full sm:w-auto">
                          Pago disponible próximamente
                        </button>
                      ) : (period.status === 'paid' || period.status === 'skipped' || period.status === 'cancelled') ? (
                        <div className="text-sm text-gray-400 italic">Sin acciones pendientes</div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { components } from '@/lib/api/types.generated';
import { formatMoneyOrDash } from '@/lib/format/money';
import { getObligationPeriodsAction, syncObligationPeriodsAction, updateObligationPeriodAmountAction, skipObligationPeriodAction, payObligationPeriodAction, payObligationFifoAction } from './actions';

type ObligationRead = components['schemas']['ObligationRead'];
type AccountRead = components['schemas']['AccountRead'];
type ObligationPeriodRead = components['schemas']['ObligationPeriodRead'];

interface ExtendedPeriod extends ObligationPeriodRead {
  remaining_amount?: string;
}

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

export default function ObligationsClient({ initialObligations, accounts }: ObligationsClientProps) {
  const [periodsByObligation, setPeriodsByObligation] = useState<Record<string, ObligationPeriodRead[]>>({});
  const [loading, setLoading] = useState(initialObligations.length > 0);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [defineAmountModal, setDefineAmountModal] = useState({ open: false, periodId: '', obligationId: '' });
  const [amountInput, setAmountInput] = useState('');
  const [skipModal, setSkipModal] = useState({ open: false, periodId: '', obligationId: '' });

  const [payPeriodModal, setPayPeriodModal] = useState<{ open: boolean, period: ObligationPeriodRead | null, obligation: ObligationRead | null }>({ open: false, period: null, obligation: null });
  const [payFifoModal, setPayFifoModal] = useState<{ open: boolean, obligation: ObligationRead | null }>({ open: false, obligation: null });
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

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

  const handleDefineAmount = async () => {
    if (!amountInput || isNaN(Number(amountInput))) return;
    setActionLoading(true);
    setActionError(null);

    const res = await updateObligationPeriodAmountAction(defineAmountModal.periodId, amountInput);
    if (res.success) {
      await handleSync(defineAmountModal.obligationId);
      setDefineAmountModal({ open: false, periodId: '', obligationId: '' });
      setAmountInput('');
    } else {
      setActionError(res.error || 'No pudimos definir el monto de este periodo.');
    }
    setActionLoading(false);
  };

  const handleSkip = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const res = await skipObligationPeriodAction(skipModal.periodId);
    if (res.success) {
      await handleSync(skipModal.obligationId);
      setSkipModal({ open: false, periodId: '', obligationId: '' });
      setActionSuccess('Periodo saltado correctamente.');
    } else {
      setActionError(res.error || 'No pudimos saltar este periodo.');
    }
    setActionLoading(false);
  };

  const handlePayPeriod = async () => {
    if (!paymentAccountId || !paymentAmount || isNaN(Number(paymentAmount))) {
      setActionError('Por favor, ingresa un monto válido y selecciona una cuenta.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const payload = { account_id: paymentAccountId, amount: paymentAmount };
    const idempotencyKey = crypto.randomUUID();
    const res = await payObligationPeriodAction(payPeriodModal.period!.id, payload, idempotencyKey);
    if (res.success) {
      await handleSync(payPeriodModal.obligation!.id);
      setPayPeriodModal({ open: false, period: null, obligation: null });
      setActionSuccess('Pago registrado correctamente.');
    } else {
      setActionError(res.error || 'No pudimos registrar este pago.');
    }
    setActionLoading(false);
  };

  const handlePayFifo = async () => {
    if (!paymentAccountId || !paymentAmount || isNaN(Number(paymentAmount))) {
      setActionError('Por favor, ingresa un monto válido y selecciona una cuenta.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const payload = { account_id: paymentAccountId, amount: paymentAmount };
    const idempotencyKey = crypto.randomUUID();
    const res = await payObligationFifoAction(payFifoModal.obligation!.id, payload, idempotencyKey);
    if (res.success) {
      await handleSync(payFifoModal.obligation!.id);
      setPayFifoModal({ open: false, obligation: null });
      setActionSuccess('Pago registrado correctamente.');
    } else {
      setActionError(res.error || 'No pudimos registrar este pago.');
    }
    setActionLoading(false);
  };

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

      {actionSuccess && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-2xl border border-green-100 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-green-700 font-bold hover:text-green-900">&times;</button>
        </div>
      )}

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
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <button
                      onClick={() => {
                        setPayFifoModal({ open: true, obligation: ob });
                        setPaymentAmount('');
                        if (accounts.length > 0) setPaymentAccountId(accounts[0].id);
                        setActionError(null);
                        setActionSuccess(null);
                      }}
                      disabled={actionLoading}
                      className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      Pagar obligación
                    </button>
                    <button
                      onClick={() => handleSync(ob.id)}
                      disabled={syncing[ob.id]}
                      className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {syncing[ob.id] ? 'Sincronizando...' : 'Sincronizar'}
                    </button>
                  </div>
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
                          {formatMoneyOrDash((period as ExtendedPeriod).remaining_amount, period.currency)}
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

                    <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
                      {['pending_amount_definition', 'pending_payment', 'partially_paid', 'overdue'].includes(period.status) && (
                        <button
                          onClick={() => setSkipModal({ open: true, periodId: period.id, obligationId: ob.id })}
                          className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto"
                        >
                          Saltar periodo
                        </button>
                      )}

                      {period.status === 'pending_amount_definition' ? (
                        <button
                          onClick={() => setDefineAmountModal({ open: true, periodId: period.id, obligationId: ob.id })}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto"
                        >
                          Definir monto
                        </button>
                      ) : (period.status === 'pending_payment' || period.status === 'partially_paid' || period.status === 'overdue') ? (
                        <button
                          onClick={() => {
                            setPayPeriodModal({ open: true, period: period, obligation: ob });
                            setPaymentAmount((period as ExtendedPeriod).remaining_amount || '');
                            if (accounts.length > 0) setPaymentAccountId(accounts[0].id);
                            setActionError(null);
                            setActionSuccess(null);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto"
                        >
                          Pagar periodo
                        </button>
                      ) : (period.status === 'paid' || period.status === 'skipped' || period.status === 'cancelled') ? (
                        <div className="text-sm text-gray-400 italic mt-2">Sin acciones pendientes</div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {defineAmountModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-xl font-semibold text-graphite-blue mb-2">Definir monto</h3>
            <p className="text-sm text-gray-500 mb-6">Ingresa el monto de este periodo para poder realizar pagos.</p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                {actionError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto
              </label>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-graphite-blue"
                placeholder="Ej. 150000"
                disabled={actionLoading}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setDefineAmountModal({ open: false, periodId: '', obligationId: '' });
                  setAmountInput('');
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDefineAmount}
                disabled={actionLoading || !amountInput}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Guardando...' : 'Guardar monto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {skipModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-xl font-semibold text-graphite-blue mb-2">Saltar periodo</h3>
            <p className="text-sm text-gray-500 mb-6">¿Seguro que quieres saltar este periodo? Esta acción marcará este periodo como saltado si el backend lo permite.</p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                {actionError}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setSkipModal({ open: false, periodId: '', obligationId: '' });
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSkip}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Saltando...' : 'Saltar periodo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {payPeriodModal.open && payPeriodModal.period && payPeriodModal.obligation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-xl font-semibold text-graphite-blue mb-2">Pagar periodo</h3>
            <p className="text-sm text-gray-500 mb-2">
              Obligación: <span className="font-medium text-gray-900">{payPeriodModal.obligation.name}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Monto pendiente: <span className="font-semibold text-graphite-blue">{formatMoneyOrDash((payPeriodModal.period as ExtendedPeriod).remaining_amount, payPeriodModal.period.currency)}</span>
            </p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                {actionError}
              </div>
            )}

            {accounts.length === 0 ? (
              <div className="mb-6 p-4 bg-orange-50 text-orange-700 text-sm rounded-xl">
                No tienes cuentas disponibles para pagar esta obligación.
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta fuente</label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-graphite-blue bg-white"
                    disabled={actionLoading}
                  >
                    <option value="" disabled>Selecciona una cuenta</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency}) - Saldo: {formatMoneyOrDash(acc.balance, acc.currency)}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto a pagar ({payPeriodModal.period.currency})
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-graphite-blue"
                    placeholder="Ej. 150000"
                    disabled={actionLoading}
                  />
                </div>
              </>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setPayPeriodModal({ open: false, period: null, obligation: null });
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayPeriod}
                disabled={actionLoading || accounts.length === 0 || !paymentAmount}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Registrando pago...' : 'Pagar periodo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {payFifoModal.open && payFifoModal.obligation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-xl font-semibold text-graphite-blue mb-2">Pagar obligación</h3>
            <p className="text-sm text-gray-500 mb-1">
              Obligación: <span className="font-medium text-gray-900">{payFifoModal.obligation.name}</span>
            </p>
            <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded-xl mb-6">
              Nexum aplicará este pago automáticamente a los periodos pendientes según prioridad.
            </p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                {actionError}
              </div>
            )}

            {accounts.length === 0 ? (
              <div className="mb-6 p-4 bg-orange-50 text-orange-700 text-sm rounded-xl">
                No tienes cuentas disponibles para pagar esta obligación.
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta fuente</label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-graphite-blue bg-white"
                    disabled={actionLoading}
                  >
                    <option value="" disabled>Selecciona una cuenta</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency}) - Saldo: {formatMoneyOrDash(acc.balance, acc.currency)}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto a pagar ({payFifoModal.obligation.currency})
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-graphite-blue"
                    placeholder="Ej. 150000"
                    disabled={actionLoading}
                  />
                </div>
              </>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setPayFifoModal({ open: false, obligation: null });
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayFifo}
                disabled={actionLoading || accounts.length === 0 || !paymentAmount}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Registrando pago...' : 'Pagar obligación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

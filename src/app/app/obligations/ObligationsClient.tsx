'use client';

import React, { useState, useEffect } from 'react';
import { components } from '@/lib/api/types.generated';
import { formatMoneyOrDash } from '@/lib/format/money';
import { createObligationAction, getObligationPeriodsAction, syncObligationPeriodsAction, updateObligationPeriodAmountAction, skipObligationPeriodAction, payObligationPeriodAction, payObligationFifoAction, previewObligationPeriodPaymentAction } from './actions';

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

export default function ObligationsClient({ initialObligations, accounts }: ObligationsClientProps) {
  const [periodsByObligation, setPeriodsByObligation] = useState<Record<string, ObligationPeriodRead[]>>({});
  const [loading, setLoading] = useState(initialObligations.length > 0);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [defineAmountModal, setDefineAmountModal] = useState({ open: false, periodId: '', obligationId: '' });
  const [amountInput, setAmountInput] = useState('');
  const [skipModal, setSkipModal] = useState({ open: false, periodId: '', obligationId: '' });
  const [payModal, setPayModal] = useState({ open: false, obligationId: '', periodId: '', defaultAmount: '', currency: '', isFifo: false, remainingAmount: null as string | null });
  const [payAccountId, setPayAccountId] = useState('');
  const [payAmountInput, setPayAmountInput] = useState('');
  const [paymentMode, setPaymentMode] = useState<'remaining' | 'custom'>('remaining');
  const [previewData, setPreviewData] = useState<components['schemas']['ObligationPaymentPreviewRead'] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cachedFxRate, setCachedFxRate] = useState<number | null>(null);

  const [createData, setCreateData] = useState<Partial<components['schemas']['ObligationCreate']>>({
    name: '',
    currency: 'COP',
    type: 'debt',
    frequency: 'monthly',
    payment_mode: 'fixed',
    base_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    first_due_date: new Date().toISOString().split('T')[0],
    interval_count: 1,
  });

  const handleCreate = async () => {
    setActionLoading(true);
    setActionError(null);

    const payload = { ...createData } as components['schemas']['ObligationCreate'];
    
    // Convert base_amount to number if it's provided, or delete if empty and variable
    if (payload.base_amount === '') {
      delete payload.base_amount;
    } else if (payload.base_amount) {
      payload.base_amount = Number(payload.base_amount);
    }

    const res = await createObligationAction(payload);
    
    if (res.success && res.result) {
      // Sync periods immediately after creation so the UI gets populated
      await syncObligationPeriodsAction(res.result.id);
      
      setCreateModalOpen(false);
      setCreateData({
        name: '',
        currency: 'COP',
        type: 'debt',
        frequency: 'monthly',
        payment_mode: 'fixed',
        base_amount: '',
        start_date: new Date().toISOString().split('T')[0],
        first_due_date: new Date().toISOString().split('T')[0],
        interval_count: 1,
      });
      // The page will revalidate and we'll receive new initialObligations via props.
    } else {
      setActionError(res.error || 'No pudimos crear la obligación.');
    }
    
    setActionLoading(false);
  };

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

  useEffect(() => {
    if (!payModal.open || !payAccountId || !payAmountInput || isNaN(Number(payAmountInput)) || payModal.isFifo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewData(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setPreviewLoading(true);
      const res = await previewObligationPeriodPaymentAction(payModal.periodId, {
        account_id: payAccountId,
        amount: Number(payAmountInput),
      });
      if (res.success && res.result) {
        setPreviewData(res.result);
        if (res.result.fx_rate) {
          setCachedFxRate(Number(res.result.fx_rate));
        }
        setActionError(null);
      } else {
        setPreviewData(null);
        setActionError(res.error || 'Error calculando vista previa.');
      }
      setPreviewLoading(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [payAccountId, payAmountInput, payModal.open, payModal.periodId, payModal.isFifo]);

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
    const res = await skipObligationPeriodAction(skipModal.periodId);
    if (res.success) {
      await handleSync(skipModal.obligationId);
      setSkipModal({ open: false, periodId: '', obligationId: '' });
    } else {
      setActionError(res.error || 'No pudimos saltar este periodo.');
    }
    setActionLoading(false);
  };

  const handleOpenPayModal = (
    obligationId: string,
    period: ObligationPeriodRead | null,
    isFifo: boolean,
    defaultAmount: string,
    currency: string
  ) => {
    if (!period) return;
    const PAYABLE_PERIOD_STATUSES = ['pending_payment', 'partially_paid', 'overdue'];
    if (!PAYABLE_PERIOD_STATUSES.includes(period.status)) {
      alert('Este periodo no tiene acciones de pago pendientes.');
      return;
    }
    setPayModal({
      open: true,
      obligationId,
      periodId: isFifo ? '' : period.id,
      defaultAmount,
      currency,
      isFifo,
      remainingAmount: period.remaining_amount ?? null
    });
    setPayAmountInput(period.remaining_amount ?? defaultAmount);
    setPaymentMode(period.remaining_amount ? 'remaining' : 'custom');
  };

  const handlePay = async () => {
    if (!payAccountId || !payAmountInput || isNaN(Number(payAmountInput))) return;
    setActionLoading(true);
    setActionError(null);

    const payload = {
      account_id: payAccountId,
      amount: Number(payAmountInput),
    };
    const idempotencyKey = crypto.randomUUID();

    let res;
    if (payModal.isFifo) {
      res = await payObligationFifoAction(payModal.obligationId, payload, idempotencyKey);
    } else {
      res = await payObligationPeriodAction(payModal.periodId, payload, idempotencyKey);
    }

    if (res.success) {
      await handleSync(payModal.obligationId);
      setPayModal({ open: false, obligationId: '', periodId: '', defaultAmount: '', currency: '', isFifo: false, remainingAmount: null });
      setPayAccountId('');
      setPayAmountInput('');
      setPreviewData(null);
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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-graphite-blue sm:text-3xl">
            Obligaciones
          </h1>
          <p className="mt-2 text-sm text-graphite-blue/60 sm:text-base">
            Controla tus compromisos y pagos pendientes.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="bg-graphite-blue hover:bg-graphite-blue/90 text-white px-5 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap"
        >
          Nueva obligación
        </button>
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
            const PAYABLE_PERIOD_STATUSES = ['pending_payment', 'partially_paid', 'overdue'];
            const canPayCurrentPeriod = period ? PAYABLE_PERIOD_STATUSES.includes(period.status) : false;
            const showSpecificPeriodPayment = canPayCurrentPeriod;

            return (
              <div key={ob.id} className="bg-white rounded-3xl border border-graphite-blue/10 shadow-sm p-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-graphite-blue">{ob.name}</h2>
                    <p className="text-sm text-graphite-blue/60 mt-1 capitalize">
                      {ob.frequency.replace('_', ' ')} • {ob.payment_mode === 'fixed' || ob.payment_mode === 'partial_allowed' || ob.payment_mode === 'fixed_full_payment' ? 'Fija' : 'Variable'} • {ob.currency}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-3">
                    {periods.length === 0 && (
                      <button
                        onClick={() => handleSync(ob.id)}
                        disabled={syncing[ob.id]}
                        className="text-xs text-gray-400 hover:text-gray-600 underline disabled:opacity-50 transition-colors"
                      >
                        {syncing[ob.id] ? 'Actualizando...' : 'Actualizar periodos'}
                      </button>
                    )}
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

                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 mb-1">Monto del Periodo</p>
                        <p className="text-lg font-semibold text-graphite-blue">
                          {formatMoneyOrDash(period.amount, period.currency)}
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
                      ) : showSpecificPeriodPayment ? (
                        <button
                          onClick={() => handleOpenPayModal(ob.id, period, false, period.amount || '', period.currency || '')}
                          className="bg-graphite-blue hover:bg-graphite-blue/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto"
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

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-gray-100 my-8">
            <h3 className="text-xl font-semibold text-graphite-blue mb-4">Nueva obligación</h3>
            
            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                {actionError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue"
                  placeholder="Ej. Crédito Vehículo"
                  disabled={actionLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                  <select
                    value={createData.currency}
                    onChange={(e) => setCreateData({ ...createData, currency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue bg-white"
                    disabled={actionLoading}
                  >
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={createData.type}
                    onChange={(e) => setCreateData({ ...createData, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue bg-white"
                    disabled={actionLoading}
                  >
                    <option value="debt">Deuda</option>
                    <option value="service">Servicio</option>
                    <option value="subscription">Suscripción</option>
                    <option value="insurance">Seguro</option>
                    <option value="tax">Impuesto</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                  <select
                    value={createData.frequency}
                    onChange={(e) => setCreateData({ ...createData, frequency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue bg-white"
                    disabled={actionLoading}
                  >
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                    <option value="bimonthly">Bimestral</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="semiannual">Semestral</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modo de pago</label>
                  <select
                    value={createData.payment_mode}
                    onChange={(e) => setCreateData({ ...createData, payment_mode: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue bg-white"
                    disabled={actionLoading}
                  >
                    <option value="fixed">Fija</option>
                    <option value="variable">Variable</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {createData.payment_mode === 'fixed' ? 'Fija: el monto suele ser el mismo en cada periodo.' : 'Variable: defines el monto cuando llegue cada periodo.'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {createData.payment_mode === 'variable' ? 'Monto referencial (Opcional)' : 'Monto base'}
                </label>
                <input
                  type="number"
                  value={createData.base_amount || ''}
                  onChange={(e) => setCreateData({ ...createData, base_amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue"
                  placeholder="Ej. 150000"
                  disabled={actionLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                  <input
                    type="date"
                    value={createData.start_date}
                    onChange={(e) => setCreateData({ ...createData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue"
                    disabled={actionLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primer vencimiento</label>
                  <input
                    type="date"
                    value={createData.first_due_date}
                    onChange={(e) => setCreateData({ ...createData, first_due_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue"
                    disabled={actionLoading}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={actionLoading || !createData.name || (createData.payment_mode !== 'variable' && !createData.base_amount)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-graphite-blue hover:bg-graphite-blue/90 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Creando...' : 'Crear obligación'}
              </button>
            </div>
          </div>
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

      {payModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-xl font-semibold text-graphite-blue mb-2">
              Pagar periodo
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              Monto original: <span className="font-semibold">{formatMoneyOrDash(payModal.defaultAmount, payModal.currency)}</span>
              {payModal.remainingAmount && (
                <span className="block mt-1">Saldo pendiente: <span className="font-semibold">{formatMoneyOrDash(payModal.remainingAmount, payModal.currency)}</span></span>
              )}
            </p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                {actionError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuenta fuente
              </label>
              <select
                value={payAccountId}
                onChange={(e) => setPayAccountId(e.target.value)}
                disabled={actionLoading}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue bg-white"
              >
                <option value="">Selecciona una cuenta</option>
                {accounts.filter(a => a.is_active !== false && String(a.is_active) !== 'false').map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency}) - Disponible: {formatMoneyOrDash(acc.balance, acc.currency)}
                  </option>
                ))}
              </select>
              {accounts.filter(a => a.is_active !== false && String(a.is_active) !== 'false').length === 0 && (
                <p className="text-red-500 text-xs mt-2">No tienes cuentas activas disponibles para pagar.</p>
              )}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Monto a pagar
                </label>
                {payModal.remainingAmount && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setPaymentMode('remaining');
                        setPayAmountInput(payModal.remainingAmount || '');
                      }}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${paymentMode === 'remaining' ? 'bg-graphite-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      type="button"
                    >
                      Pagar restante
                    </button>
                    <button 
                      onClick={() => setPaymentMode('custom')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${paymentMode === 'custom' ? 'bg-graphite-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      type="button"
                    >
                      Otro monto
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-graphite-blue ${paymentMode === 'remaining' ? 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20'}`}
                  placeholder="Ej. 50000"
                  disabled={actionLoading || paymentMode === 'remaining'}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                  {payModal.currency}
                </div>
              </div>
              
              {(() => {
                const sourceCurrency = accounts.find(a => a.id === payAccountId)?.currency;
                const isCrossCurrency = sourceCurrency && sourceCurrency !== payModal.currency;
                
                if (!payAmountInput || !payAccountId) return null;

                // Si es misma moneda, preview simple
                if (!isCrossCurrency) {
                  return (
                    <div className="mt-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-sm">
                      <p className="text-graphite-blue">
                        Se descontará <span className="font-semibold">{formatMoneyOrDash(Number(payAmountInput), payModal.currency)}</span> de esta cuenta.
                      </p>
                    </div>
                  );
                }

                // Cross-currency
                // Mostrar visual estimate INMEDIATAMENTE si hay cachedFxRate, incluso si está cargando el preview.
                // Reemplazar con datos reales cuando previewData esté listo y no esté cargando.
                
                let sourceAmountVal: number | null = null;
                let fxRateVal: number | null = null;
                let isEstimate = true;

                if (!previewLoading && previewData && previewData.source_amount) {
                  sourceAmountVal = Number(previewData.source_amount);
                  fxRateVal = Number(previewData.fx_rate);
                  isEstimate = false;
                } else if (cachedFxRate) {
                  sourceAmountVal = Number(payAmountInput) / cachedFxRate;
                  fxRateVal = cachedFxRate;
                }

                if (!sourceAmountVal) {
                   if (previewLoading) {
                     return <p className="text-xs text-gray-400 mt-2 italic">Calculando conversión...</p>;
                   }
                   return null;
                }

                return (
                  <div className={`mt-3 p-3 rounded-xl border text-sm transition-opacity ${isEstimate ? 'bg-gray-50/80 border-gray-100 opacity-80' : 'bg-blue-50/50 border-blue-100'}`}>
                    <p className="text-graphite-blue">
                      Nexum descontará aprox. <span className="font-semibold">{formatMoneyOrDash(sourceAmountVal, sourceCurrency)}</span> para cubrir <span className="font-semibold">{formatMoneyOrDash(Number(payAmountInput), payModal.currency)}</span>.
                    </p>
                    {isEstimate ? (
                      <p className="text-xs text-gray-500 mt-1">
                        Estimación visual (1 USD = {fxRateVal} COP). {previewLoading ? 'Calculando conversión real...' : 'Nexum validará al confirmar.'}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        Cotización: 1 USD = {fxRateVal} COP.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setPayModal({ open: false, obligationId: '', periodId: '', defaultAmount: '', currency: '', isFifo: false, remainingAmount: null });
                  setPayAccountId('');
                  setPayAmountInput('');
                  setPreviewData(null);
                  setCachedFxRate(null);
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePay}
                disabled={actionLoading || !payAmountInput || !payAccountId || (previewLoading) || !!actionError}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-graphite-blue hover:bg-graphite-blue/90 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Registrando pago...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

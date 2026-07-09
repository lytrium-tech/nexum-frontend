'use client';

import React, { useState, useEffect } from 'react';
import { components } from '@/lib/api/types.generated';
import { formatMoneyOrDash } from '@/lib/format/money';
import { 
  listObligationsV17Action, 
  getObligationsSummaryV17Action,
  getObligationPeriodsV17Action,
  updateObligationPeriodAmountV17Action,
  skipObligationPeriodV17Action,
  cancelObligationPeriodV17Action,
  refreshOverduePeriodsV17Action,
  payObligationPeriodV17Action,
  createObligationV17Action,
  previewObligationPeriodV17Action,
  getAccountsV17Action
} from './v17-actions';

type ObligationV17Response = components['schemas']['ObligationV17Response'];
type ObligationsV17SummaryResponse = components['schemas']['ObligationsV17SummaryResponse'];
type ObligationPeriodV17Response = components['schemas']['ObligationPeriodV17Response'];

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

function getRelevantPeriodV17(periods: ObligationPeriodV17Response[]): ObligationPeriodV17Response | null {
  if (!periods || periods.length === 0) return null;
  const overdue = periods.find(p => p.status === 'overdue');
  if (overdue) return overdue;
  const pendingAmount = periods.find(p => p.status === 'pending_amount_definition');
  if (pendingAmount) return pendingAmount;
  const pendingPayment = periods.find(p => p.status === 'pending_payment');
  if (pendingPayment) return pendingPayment;
  const partiallyPaid = periods.find(p => p.status === 'partially_paid');
  if (partiallyPaid) return partiallyPaid;
  const unclosed = periods.find(p => !['paid', 'skipped', 'cancelled'].includes(p.status));
  if (unclosed) return unclosed;
  return periods[periods.length - 1];
}

export default function ObligationsV17Client({ accounts = [] }: { accounts?: components['schemas']['AccountRead'][] }) {
  const [localAccounts, setLocalAccounts] = useState<components['schemas']['AccountRead'][]>(accounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [obligations, setObligations] = useState<ObligationV17Response[]>([]);
  const [summary, setSummary] = useState<ObligationsV17SummaryResponse | null>(null);
  const [periodsByObligation, setPeriodsByObligation] = useState<Record<string, ObligationPeriodV17Response[]>>({});

  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [defineAmountModal, setDefineAmountModal] = useState({ open: false, periodId: '', obligationId: '' });
  const [amountInput, setAmountInput] = useState('');
  const [skipModal, setSkipModal] = useState({ open: false, periodId: '', obligationId: '' });
  const [cancelModal, setCancelModal] = useState({ open: false, periodId: '', obligationId: '' });
  const [payModal, setPayModal] = useState({ open: false, periodId: '', obligationId: '', amountDue: '' });
  const [payMode, setPayMode] = useState<'remaining' | 'other'>('remaining');
  const [payAmountInput, setPayAmountInput] = useState('');
  const [payAccountInput, setPayAccountInput] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [fxQuote, setFxQuote] = useState<components['schemas']['ObligationPaymentPreviewV17Response'] | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    obligation_type: 'recurring' as components['schemas']['ObligationType'],
    frequency: 'monthly' as components['schemas']['Frequency'],
    amount_type: 'fixed' as components['schemas']['AmountType'],
    base_amount: '',
    currency: 'COP',
    start_date: new Date().toISOString().split('T')[0],
    first_due_date: new Date().toISOString().split('T')[0],
  });

  const fetchAllData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [listRes, summaryRes] = await Promise.all([
        listObligationsV17Action(),
        getObligationsSummaryV17Action()
      ]);
      
      if (!listRes.success) {
        if (isInitial) setError(listRes.error || 'No pudimos cargar Obligaciones V1.7.');
        return;
      }
      if (!summaryRes.success) {
        if (isInitial) setError(summaryRes.error || 'No pudimos cargar Obligaciones V1.7.');
        return;
      }

      setObligations(listRes.result || []);
      setSummary(summaryRes.result || null);

      if (listRes.result) {
        const periodsData: Record<string, ObligationPeriodV17Response[]> = {};
        for (const ob of listRes.result) {
          const periodsRes = await getObligationPeriodsV17Action(ob.id);
          if (periodsRes.success && periodsRes.result) {
            periodsData[ob.id] = Array.isArray(periodsRes.result) ? periodsRes.result : [];
          }
        }
        setPeriodsByObligation(periodsData);
      }
    } catch (e) {
      console.error(e);
      if (isInitial) setError('No pudimos cargar Obligaciones V1.7.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllData(true).then(() => {
      if (!mounted) return;
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!payModal.open || !payAccountInput) {
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
      setFxQuote(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
      setPreviewLoading(false);
      return;
    }
    
    const currentOb = obligations.find(o => o.id === payModal.obligationId);
    const selectedAcc = localAccounts.find(a => a.id === payAccountInput);
    
    if (!currentOb || !selectedAcc || currentOb.currency === selectedAcc.currency) {
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
      setFxQuote(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
      setPreviewLoading(false);
      return;
    }

    const currentPeriod = periodsByObligation[payModal.obligationId]?.find(p => p.id === payModal.periodId);
    const currentAmountDue = currentPeriod?.amount_due || '0';
    const finalAmount = payMode === 'remaining' ? currentAmountDue : payAmountInput;
    if (!finalAmount || isNaN(Number(finalAmount)) || Number(finalAmount) <= 0) {
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
      setFxQuote(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
      setPreviewLoading(false);
      return;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    setPreviewLoading(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    setFxQuote(null);

    const timer = setTimeout(async () => {
      const res = await previewObligationPeriodV17Action(payModal.obligationId, payModal.periodId, {
        amount: Number(finalAmount),
        account_id: selectedAcc.id,
      });
      if (res.success && res.result) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setFxQuote(res.result);
      } else {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setFxQuote(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setPreviewLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [payModal.open, payModal.obligationId, payModal.periodId, payMode, payAmountInput, payAccountInput, obligations, localAccounts, periodsByObligation]);

  const refreshObligationAfterMutation = async (obligationId: string) => {
    try {
      const [summaryRes, periodsRes, listRes, accountsRes] = await Promise.all([
        getObligationsSummaryV17Action(),
        getObligationPeriodsV17Action(obligationId),
        listObligationsV17Action(),
        getAccountsV17Action()
      ]);
      
      if (summaryRes.success && summaryRes.result) {
        setSummary(summaryRes.result);
      }
      if (periodsRes.success && periodsRes.result) {
        setPeriodsByObligation(prev => ({
          ...prev,
          [obligationId]: Array.isArray(periodsRes.result) ? periodsRes.result : []
        }));
      }
      if (listRes.success && listRes.result) {
        setObligations(listRes.result);
      }
      if (accountsRes.success && accountsRes.result) {
        setLocalAccounts(accountsRes.result);
      }
    } catch (e) {
      console.error(e);
      await fetchAllData();
    }
  };

  const handleDefineAmount = async () => {
    if (!amountInput || isNaN(Number(amountInput))) return;
    setActionLoading(true);
    setActionError(null);
    const res = await updateObligationPeriodAmountV17Action(defineAmountModal.obligationId, defineAmountModal.periodId, { amount: Number(amountInput) });
    if (res.success) {
      const obId = defineAmountModal.obligationId;
      setDefineAmountModal({ open: false, periodId: '', obligationId: '' });
      setAmountInput('');
      await refreshObligationAfterMutation(obId);
    } else {
      setActionError(res.error || 'No pudimos definir el monto de este periodo.');
    }
    setActionLoading(false);
  };

  const handleSkip = async () => {
    setActionLoading(true);
    setActionError(null);
    const res = await skipObligationPeriodV17Action(skipModal.obligationId, skipModal.periodId);
    if (res.success) {
      const obId = skipModal.obligationId;
      setSkipModal({ open: false, periodId: '', obligationId: '' });
      await refreshObligationAfterMutation(obId);
    } else {
      setActionError(res.error || 'No pudimos saltar este periodo.');
    }
    setActionLoading(false);
  };

  const handleCancel = async () => {
    setActionLoading(true);
    setActionError(null);
    const res = await cancelObligationPeriodV17Action(cancelModal.obligationId, cancelModal.periodId);
    if (res.success) {
      const obId = cancelModal.obligationId;
      setCancelModal({ open: false, periodId: '', obligationId: '' });
      await refreshObligationAfterMutation(obId);
    } else {
      setActionError(res.error || 'No pudimos cancelar este periodo.');
    }
    setActionLoading(false);
  };

  const handlePayPeriod = async () => {
    const currentPeriod = periodsByObligation[payModal.obligationId]?.find(p => p.id === payModal.periodId);
    const currentAmountDue = currentPeriod?.amount_due || '0';
    const finalAmount = payMode === 'remaining' ? currentAmountDue : payAmountInput;
    if (!finalAmount || isNaN(Number(finalAmount)) || !payAccountInput) return;
    setActionLoading(true);
    setActionError(null);
    const idempotencyKey = crypto.randomUUID();
    
    const payload: components['schemas']['ObligationPeriodPaymentCreateRequest'] = {
      amount: Number(finalAmount),
      source_account_id: payAccountInput,
    };

    if (fxQuote && fxQuote.quote_id) {
      payload.quote_id = fxQuote.quote_id;
    }

    const res = await payObligationPeriodV17Action(payModal.obligationId, payModal.periodId, payload, idempotencyKey);
    if (res.success) {
      const obId = payModal.obligationId;
      setPayModal({ open: false, periodId: '', obligationId: '', amountDue: '' });
      setPayAmountInput('');
      setPayAccountInput('');
      setPayMode('remaining');
      setFxQuote(null);
      await refreshObligationAfterMutation(obId);
    } else {
      setActionError(res.error || 'No pudimos registrar este pago. Revisa el monto y la cuenta.');
    }
    setActionLoading(false);
  };

  const handleRefreshOverdue = async (id: string) => {
    setSyncing(prev => ({ ...prev, [id]: true }));
    const res = await refreshOverduePeriodsV17Action(id);
    if (res.success) {
      await fetchAllData();
    }
    setSyncing(prev => ({ ...prev, [id]: false }));
  };

  const handleCreateObligation = async () => {
    if (!createForm.name) return;
    setActionLoading(true);
    setActionError(null);
    const payload: components['schemas']['ObligationV17CreateRequest'] = {
      name: createForm.name,
      obligation_type: createForm.obligation_type,
      frequency: createForm.frequency,
      amount_type: createForm.amount_type,
      currency: createForm.currency,
      start_date: createForm.start_date,
      first_due_date: createForm.first_due_date,
    };
    if (createForm.base_amount) {
      payload.base_amount = Number(createForm.base_amount);
    }
    const res = await createObligationV17Action(payload);
    if (res.success) {
      setCreateModalOpen(false);
      setCreateForm({
        name: '',
        obligation_type: 'recurring',
        frequency: 'monthly',
        amount_type: 'fixed',
        base_amount: '',
        currency: 'COP',
        start_date: new Date().toISOString().split('T')[0],
        first_due_date: new Date().toISOString().split('T')[0],
      });
      await fetchAllData();
    } else {
      setActionError(res.error || 'Ocurrió un error al crear la obligación.');
    }
    setActionLoading(false);
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
            Obligaciones (V1.7)
          </h1>
          <p className="mt-2 text-sm text-graphite-blue/60 sm:text-base">
            Controla tus compromisos y pagos pendientes.
          </p>
        </div>
        <button
          onClick={() => { setActionError(null); setCreateModalOpen(true); }}
          className="bg-graphite-blue hover:bg-graphite-blue/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
        >
          Nueva obligación
        </button>
      </div>

      {summary && (
        <div className="mb-8 bg-white rounded-3xl border border-graphite-blue/10 shadow-sm p-6 overflow-hidden">
          <h2 className="text-lg font-semibold text-graphite-blue mb-4">Resumen del mes</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
            const periods = periodsByObligation[ob.id] || [];
            const period = getRelevantPeriodV17(periods);
            
            return (
              <div key={ob.id} className="bg-white rounded-3xl border border-graphite-blue/10 shadow-sm p-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-graphite-blue">{ob.name}</h2>
                    <p className="text-sm text-graphite-blue/60 mt-1 capitalize">
                      {ob.frequency.replace('_', ' ')} • {ob.amount_type ? getPaymentModeLabel(ob.amount_type) : '—'} • {ob.currency}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-3 mb-2">
                  <button
                    onClick={() => handleRefreshOverdue(ob.id)}
                    disabled={syncing[ob.id]}
                    className="text-xs text-gray-400 hover:text-gray-600 underline disabled:opacity-50 transition-colors"
                  >
                    {syncing[ob.id] ? 'Actualizando...' : 'Actualizar vencimientos'}
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

                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 mb-1">Monto del Periodo</p>
                        <p className="text-lg font-semibold text-graphite-blue">
                          {formatMoneyOrDash(period.amount_due, ob.currency)}
                        </p>
                      </div>
                    </div>

                    {parseFloat(period.amount_paid || '0') > 0 && (
                      <div className="mt-3 text-right">
                        <p className="text-sm text-gray-500">
                          Pagado: <span className="font-medium text-graphite-blue">{formatMoneyOrDash(period.amount_paid, ob.currency)}</span>
                        </p>
                      </div>
                    )}

                    <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
                      {['pending_amount_definition', 'pending_payment', 'partially_paid', 'overdue'].includes(period.status) && (
                        <>
                          <button
                            type="button"
                            onClick={() => setCancelModal({ open: true, periodId: period.id, obligationId: ob.id })}
                            className="bg-white hover:bg-gray-50 border border-gray-200 text-red-600 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => setSkipModal({ open: true, periodId: period.id, obligationId: ob.id })}
                            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto"
                          >
                            Saltar
                          </button>
                        </>
                      )}

                      {period.status === 'pending_amount_definition' ? (
                        <button
                          type="button"
                          onClick={() => setDefineAmountModal({ open: true, periodId: period.id, obligationId: ob.id })}
                          className="bg-graphite-blue hover:bg-graphite-blue/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto"
                        >
                          Definir monto
                        </button>
                      ) : ['pending_payment', 'partially_paid', 'overdue'].includes(period.status) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPayModal({ open: true, periodId: period.id, obligationId: ob.id, amountDue: period.amount_due });
                            setPayMode('remaining');
                          }}
                          className="bg-graphite-blue hover:bg-graphite-blue/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto"
                        >
                          Pagar periodo
                        </button>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-gray-100 my-8">
            <h3 className="text-xl font-semibold text-graphite-blue mb-2">Nueva obligación</h3>
            <p className="text-sm text-gray-500 mb-6">Registra un nuevo compromiso financiero.</p>

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
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none text-graphite-blue"
                  placeholder="Ej. Tarjeta de Crédito, Arriendo..."
                  disabled={actionLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={createForm.obligation_type}
                    onChange={(e) => setCreateForm({ ...createForm, obligation_type: e.target.value as components['schemas']['ObligationType'] })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue outline-none text-graphite-blue bg-white"
                    disabled={actionLoading}
                  >
                    <option value="recurring">Recurrente</option>
                    <option value="one_time">Una vez</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                  <select
                    value={createForm.frequency}
                    onChange={(e) => setCreateForm({ ...createForm, frequency: e.target.value as components['schemas']['Frequency'] })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue outline-none text-graphite-blue bg-white"
                    disabled={actionLoading}
                  >
                    <option value="monthly">Mensual</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="yearly">Anual</option>
                    <option value="one_time">Una vez</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de monto</label>
                  <select
                    value={createForm.amount_type}
                    onChange={(e) => setCreateForm({ ...createForm, amount_type: e.target.value as components['schemas']['AmountType'] })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue outline-none text-graphite-blue bg-white"
                    disabled={actionLoading}
                  >
                    <option value="fixed">Fija</option>
                    <option value="variable">Variable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                  <select
                    value={createForm.currency}
                    onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue outline-none text-graphite-blue bg-white"
                    disabled={actionLoading}
                  >
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto base (opcional)</label>
                <input
                  type="number"
                  value={createForm.base_amount}
                  onChange={(e) => setCreateForm({ ...createForm, base_amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue outline-none text-graphite-blue"
                  placeholder="Ej. 150000"
                  disabled={actionLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                  <input
                    type="date"
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue outline-none text-graphite-blue"
                    disabled={actionLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primer vencimiento</label>
                  <input
                    type="date"
                    value={createForm.first_due_date}
                    onChange={(e) => setCreateForm({ ...createForm, first_due_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-graphite-blue outline-none text-graphite-blue"
                    disabled={actionLoading}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateObligation}
                disabled={actionLoading || !createForm.name}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-graphite-blue hover:bg-graphite-blue/90 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Creando...' : 'Crear obligación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue"
                placeholder="Ej. 150000"
                disabled={actionLoading}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
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
                type="button"
                onClick={handleDefineAmount}
                disabled={actionLoading || !amountInput}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-graphite-blue hover:bg-graphite-blue/90 disabled:opacity-50 transition-colors"
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
                type="button"
                onClick={() => {
                  setSkipModal({ open: false, periodId: '', obligationId: '' });
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Saltando...' : 'Saltar periodo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-xl font-semibold text-red-600 mb-2">Cancelar periodo</h3>
            <p className="text-sm text-gray-500 mb-6">¿Seguro que quieres cancelar este periodo? Esta acción anulará el periodo y podría afectar tu estado.</p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                {actionError}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setCancelModal({ open: false, periodId: '', obligationId: '' });
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Cancelando...' : 'Cancelar periodo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {payModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-xl font-semibold text-graphite-blue mb-2">Pagar periodo</h3>
            <p className="text-sm text-gray-500 mb-6">Ingresa el monto a pagar y selecciona la cuenta de origen.</p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                {actionError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta fuente</label>
                <select
                  value={payAccountInput}
                  onChange={(e) => setPayAccountInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue"
                  disabled={actionLoading}
                >
                  <option value="">Selecciona una cuenta</option>
                  {localAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatMoneyOrDash(acc.balance, acc.currency)})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setPayMode('remaining')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${payMode === 'remaining' ? 'bg-graphite-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Pagar saldo
                </button>
                <button
                  type="button"
                  onClick={() => setPayMode('other')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${payMode === 'other' ? 'bg-graphite-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Otro monto
                </button>
              </div>

              {payMode === 'remaining' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto a pagar</label>
                  <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500">
                    {(() => {
                      const currentPeriod = periodsByObligation[payModal.obligationId]?.find(p => p.id === payModal.periodId);
                      const currentAmountDue = currentPeriod?.amount_due || '0';
                      return `${currentAmountDue} (Monto saldo)`;
                    })()}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto a pagar</label>
                  <input
                    type="number"
                    value={payAmountInput}
                    onChange={(e) => setPayAmountInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-graphite-blue focus:ring-2 focus:ring-graphite-blue/20 outline-none transition-all text-graphite-blue"
                    placeholder="Ej. 150000"
                    disabled={actionLoading}
                  />
                </div>
              )}
              
              {payAccountInput && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                  {(() => {
                    const selectedAcc = localAccounts.find(a => a.id === payAccountInput);
                    const currentOb = obligations.find(o => o.id === payModal.obligationId);
                    if (selectedAcc && currentOb) {
                      const currentPeriod = periodsByObligation[payModal.obligationId]?.find(p => p.id === payModal.periodId);
                      const currentAmountDue = currentPeriod?.amount_due || '0';
                      const amt = payMode === 'remaining' ? currentAmountDue : (payAmountInput || '0');
                      if (selectedAcc.currency !== currentOb.currency) {
                        if (previewLoading) {
                          return "Calculando conversión...";
                        }
                        if (fxQuote && fxQuote.fx_rate) {
                          const estimatedAmount = Number(amt) / Number(fxQuote.fx_rate);
                          return `Nexum descontará aprox. ${formatMoneyOrDash(estimatedAmount.toString(), selectedAcc.currency)} para cubrir ${formatMoneyOrDash(amt, currentOb.currency)}.`;
                        } else {
                          return "No pudimos calcular la conversión.";
                        }
                      } else {
                        return `Se descontará ${formatMoneyOrDash(amt, currentOb.currency)} de esta cuenta.`;
                      }
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPayModal({ open: false, periodId: '', obligationId: '', amountDue: '' });
                  setPayAmountInput('');
                  setPayAccountInput('');
                  setPayMode('remaining');
                  setFxQuote(null);
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePayPeriod}
                disabled={actionLoading || previewLoading || (payMode === 'other' && !payAmountInput) || !payAccountInput || (localAccounts.find(a => a.id === payAccountInput)?.currency !== obligations.find(o => o.id === payModal.obligationId)?.currency && !fxQuote)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-graphite-blue hover:bg-graphite-blue/90 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Procesando...' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

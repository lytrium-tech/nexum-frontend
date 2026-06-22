'use client';

import { useState, useMemo } from 'react';
import { components } from '@/lib/api/types.generated';
import { createObligationAction, payObligationAction, updateObligationAction } from './actions';

const formatCurrency = (val: number | string, currency = 'COP') => new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(val));

const DocumentIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const Plus = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const AlertCircle = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const X = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const CheckCircle = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const Calendar = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ArrowRight = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
const CreditCard = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;

type ObligationRead = components['schemas']['ObligationRead'];
type AccountRead = components['schemas']['AccountRead'];

interface ObligationsClientProps {
  initialObligations: ObligationRead[];
  accounts: AccountRead[];
}

export default function ObligationsClient({ initialObligations, accounts }: ObligationsClientProps) {
  const [obligations, setObligations] = useState<ObligationRead[]>(initialObligations);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<ObligationRead | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  const [dueDay, setDueDay] = useState<string>('');
  const [initialStatus, setInitialStatus] = useState<'pending' | 'paid' | 'next_period'>('pending');

  const currentDay = useMemo(() => new Date().getDate(), []);
  const isPastDue = dueDay ? parseInt(dueDay, 10) < currentDay : false;

  const activeObligations = obligations.filter(o => o.is_active !== false);
  const archivedObligations = obligations.filter(o => o.is_active === false);
  const displayedObligations = activeTab === 'active' ? activeObligations : archivedObligations;

  const activeAccounts = accounts.filter(a => a.is_active !== false);

  const openPayModal = (obligation: ObligationRead) => {
    setSelectedObligation(obligation);
    setIsPayModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsPayModalOpen(false);
    setSelectedObligation(null);
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
    setDueDay('');
    setInitialStatus('pending');
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const amountStr = formData.get('amount') as string;
    const paymentMode = formData.get('paymentMode') as string || 'fixed_full_payment';
    const frequency = formData.get('frequency') as string;

    const amount = parseFloat(amountStr);
    if (paymentMode !== 'variable_amount' && (isNaN(amount) || amount <= 0)) {
      setError('El monto base es requerido para este modo de pago');
      setIsSubmitting(false);
      return;
    }

    if (!name.trim()) {
      setError('El nombre es requerido');
      setIsSubmitting(false);
      return;
    }

    const payload: components['schemas']['ObligationCreate'] = {
      name: name.trim(),
      amount: isNaN(amount) ? undefined : amount,
      payment_mode: paymentMode,
      already_paid_this_period: false,
      start_next_period: false,
      pending_this_period: true,
    };

    if (isPastDue) {
      if (initialStatus === 'paid') {
        payload.already_paid_this_period = true;
        payload.pending_this_period = false;
        payload.start_next_period = false;
      } else if (initialStatus === 'next_period') {
        payload.already_paid_this_period = false;
        payload.pending_this_period = false;
        payload.start_next_period = true;
      }
    }

    if (dueDay) {
      const day = parseInt(dueDay, 10);
      if (day >= 1 && day <= 31) {
        payload.due_day = day;
      }
    }
    if (frequency) {
      payload.frequency = frequency;
    }

    const res = await createObligationAction(payload);
    
    if (res.success && res.result) {
      setObligations([...obligations, res.result]);
      setSuccessMessage('Obligación creada exitosamente.');
      setTimeout(() => {
        closeModals();
      }, 1500);
    } else {
      setError(res.error || 'Ocurrió un error al crear la obligación');
      setIsSubmitting(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedObligation) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const accountId = formData.get('accountId') as string;
    const amountStr = formData.get('amount') as string;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser mayor a 0');
      setIsSubmitting(false);
      return;
    }

    if (!accountId) {
      setError('Debes seleccionar una cuenta origen');
      setIsSubmitting(false);
      return;
    }

    const payload: components['schemas']['ObligationPaymentCreate'] = {
      account_id: accountId,
      amount
    };

    const idemKey = crypto.randomUUID();

    const res = await payObligationAction(selectedObligation.id, payload, idemKey);
    
    if (res.success && res.result) {
      setSuccessMessage('Pago registrado exitosamente.');
      setTimeout(() => {
        closeModals();
      }, 1500);
    } else {
      setError(res.error || 'Ocurrió un error al registrar el pago');
      setIsSubmitting(false);
    }
  };

  const getFrequencyLabel = (freq: string | null | undefined) => {
    if (!freq) return 'Sin frecuencia';
    const dict: Record<string, string> = {
      'monthly': 'Mensual',
      'weekly': 'Semanal',
      'yearly': 'Anual',
      'biweekly': 'Quincenal'
    };
    return dict[freq.toLowerCase()] || freq;
  };

  const getPaymentModeLabel = (mode: string | null | undefined) => {
    if (!mode) return 'Desconocido';
    const dict: Record<string, string> = {
      'fixed_full_payment': 'Fijo',
      'partial_allowed': 'Permite abonos',
      'variable_amount': 'Variable'
    };
    return dict[mode.toLowerCase()] || mode;
  };

  const getPeriodStatusLabel = (status: string | null | undefined) => {
    if (!status) return '—';
    const dict: Record<string, string> = {
      'pending': 'Pendiente',
      'partial': 'Parcial',
      'paid': 'Pagada',
      'covered': 'Cubierta este periodo',
      'overdue': 'Atrasada',
      'inactive': 'Inactiva'
    };
    return dict[status.toLowerCase()] || status;
  };

  const formatVal = (val: string | number | null | undefined, curr = 'COP') => {
    if (val == null || val === '—' || val === '') return '—';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '—';
    return formatCurrency(num, curr);
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    setIsProcessingId(id);
    setActionError(null);
    const result = await updateObligationAction(id, { is_active: newStatus });
    if (result.success) {
      setObligations(obligations.map(o => o.id === id ? { ...o, is_active: newStatus } : o));
    } else {
      setActionError({ id, message: result.error || 'Error al actualizar la obligación.' });
    }
    setIsProcessingId(null);
  };

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-graphite-blue">Obligaciones</h1>
          <p className="text-graphite-blue/60 mt-1">
            Controla tus compromisos y pagos pendientes.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-graphite-blue text-white px-5 py-2.5 rounded-full font-medium shadow-sm hover:bg-graphite-blue/90 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva obligación</span>
        </button>
      </div>

      {obligations.length > 0 && (
        <div className="flex gap-2 border-b border-graphite-blue/10 px-2 pb-2">
          <button
            onClick={() => { setActiveTab('active'); setActionError(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'active' 
                ? 'bg-graphite-blue text-white' 
                : 'text-graphite-blue/50 hover:bg-graphite-blue/5'
            }`}
          >
            Activas ({activeObligations.length})
          </button>
          <button
            onClick={() => { setActiveTab('archived'); setActionError(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'archived' 
                ? 'bg-graphite-blue text-white' 
                : 'text-graphite-blue/50 hover:bg-graphite-blue/5'
            }`}
          >
            Archivadas ({archivedObligations.length})
          </button>
        </div>
      )}

      {/* List */}
      {displayedObligations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-graphite-blue/10 shadow-sm mt-8">
          <div className="w-16 h-16 bg-sage-green/20 rounded-full flex items-center justify-center mb-4">
            <DocumentIcon className="w-8 h-8 text-sage-green" />
          </div>
          <h3 className="text-xl font-medium text-graphite-blue mb-2">
            {obligations.length === 0 
              ? 'No tienes obligaciones registradas.' 
              : activeTab === 'archived' 
                ? 'No tienes obligaciones archivadas.' 
                : 'No tienes obligaciones activas.'}
          </h3>
          {obligations.length === 0 || activeTab === 'active' ? (
            <>
              <p className="text-graphite-blue/60 max-w-sm mb-6">
                {obligations.length === 0 
                  ? 'Cuando agregues compromisos financieros, aparecerán aquí de forma clara y ordenada.'
                  : 'Puedes crear una nueva o reactivar una archivada.'}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-sage-green font-medium hover:text-sage-green/80 flex items-center gap-1 transition-colors"
              >
                <span>Crear obligación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
             <p className="text-graphite-blue/60 max-w-sm mb-6">
               Las obligaciones archivadas no generan pagos pendientes ni movimientos.
             </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {displayedObligations.map(obligation => {
            return (
              <div 
                key={obligation.id} 
                className="bg-white rounded-3xl p-6 border border-graphite-blue/10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between"
              >
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <DocumentIcon className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                </div>

                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 rounded-2xl flex items-center justify-center shrink-0 bg-graphite-blue/5 text-graphite-blue">
                      <DocumentIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-graphite-blue truncate max-w-[200px]">{obligation.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-graphite-blue/50 mt-1">
                          <span className="bg-graphite-blue/5 px-2 py-0.5 rounded-md font-medium text-graphite-blue/70">
                            {getFrequencyLabel(obligation.frequency)}
                          </span>
                          <span className="bg-graphite-blue/5 px-2 py-0.5 rounded-md font-medium text-graphite-blue/70">
                            {getPaymentModeLabel(obligation.payment_mode)}
                          </span>
                          {obligation.next_due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Vence: {new Date(obligation.next_due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {obligation.is_active === false && (
                        <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-md uppercase font-semibold shrink-0 ml-2 mt-1">
                          Archivada
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex justify-between items-end">
                    <div>
                      <p className="text-sm font-medium text-graphite-blue/60 mb-1">Monto base</p>
                      <p className="text-2xl font-semibold text-graphite-blue flex items-baseline gap-1">
                        {formatVal(obligation.amount, obligation.currency)}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        obligation.period_status === 'overdue' ? 'text-red-600 bg-red-50' :
                        obligation.period_status === 'pending' ? 'text-amber-600 bg-amber-50' :
                        obligation.period_status === 'partial' ? 'text-blue-600 bg-blue-50' :
                        obligation.period_status === 'covered' ? 'text-graphite-blue/70 bg-graphite-blue/5' :
                        'text-sage-green bg-sage-green/10'
                      }`}>
                        {obligation.period_status === 'overdue' ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />} {getPeriodStatusLabel(obligation.period_status)}
                      </span>
                      {obligation.period_status === 'covered' && (
                        <span className="text-[10px] text-graphite-blue/40 mt-1 max-w-[120px] leading-tight text-right">
                          Marcada como pagada fuera de Nexum.
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-graphite-blue/5 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-graphite-blue/50 block">Pagado este periodo:</span>
                      <span className="font-medium text-graphite-blue">{formatVal(obligation.paid_this_period, obligation.currency)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-graphite-blue/50 block">Restante:</span>
                      <span className="font-medium text-graphite-blue">{formatVal(obligation.remaining_amount, obligation.currency)}</span>
                    </div>
                  </div>
                </div>

                  {actionError?.id === obligation.id && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                      {actionError.message}
                    </div>
                  )}

                <div className="mt-6 pt-5 border-t border-graphite-blue/5 flex gap-3">
                  {obligation.is_active !== false ? (
                    <>
                      <button
                        onClick={() => handleToggleStatus(obligation.id, false)}
                        disabled={isProcessingId === obligation.id}
                        className="flex-1 py-2 bg-graphite-blue/5 text-graphite-blue/70 hover:bg-graphite-blue/10 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Archivar
                      </button>
                      {(() => {
                        const remaining = parseFloat(String(obligation.remaining_amount || "0"));
                        const canPay = obligation.is_pending || remaining > 0;
                        
                        let buttonText = 'Registrar pago';
                        if (!canPay) {
                          buttonText = obligation.period_status === 'covered' ? 'Cubierta' : 'Pagada';
                        }

                        return (
                          <button
                            onClick={() => openPayModal(obligation)}
                            disabled={!canPay}
                            className={`flex-[2] py-2 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2 ${canPay ? 'bg-graphite-blue text-white hover:bg-graphite-blue/90' : 'bg-graphite-blue/5 text-graphite-blue/40 cursor-not-allowed'}`}
                          >
                            <CreditCard className="w-4 h-4" />
                            {buttonText}
                          </button>
                        );
                      })()}
                    </>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(obligation.id, true)}
                      disabled={isProcessingId === obligation.id}
                      className="flex-1 py-2 bg-graphite-blue/5 text-graphite-blue/70 hover:bg-graphite-blue/10 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Reactivar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-blue/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-graphite-blue flex items-center gap-2">
                <DocumentIcon className="w-5 h-5 text-sage-green" />
                Nueva obligación
              </h2>
              <button 
                onClick={closeModals}
                className="text-graphite-blue/40 hover:text-graphite-blue transition-colors p-1"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="mb-6 p-3 rounded-xl bg-green-50 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm text-green-700 font-medium">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="name">
                  Nombre de la obligación *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ej: Arriendo, Internet, Plan móvil"
                  className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                  disabled={isSubmitting || !!successMessage}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="paymentMode">
                  Modo de pago
                </label>
                <select
                  id="paymentMode"
                  name="paymentMode"
                  className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors text-graphite-blue outline-none appearance-none"
                  disabled={isSubmitting || !!successMessage}
                >
                  <option value="fixed_full_payment">Pago completo fijo</option>
                  <option value="partial_allowed">Permite abonos</option>
                  <option value="variable_amount">Monto variable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="amount">
                  Monto base *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-blue/40 font-medium">
                    $
                  </span>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                    disabled={isSubmitting || !!successMessage}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="frequency">
                    Frecuencia
                  </label>
                  <select
                    id="frequency"
                    name="frequency"
                    className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors text-graphite-blue outline-none appearance-none"
                    disabled={isSubmitting || !!successMessage}
                  >
                    <option value="monthly">Mensual</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="yearly">Anual</option>
                    <option value="">Ninguna</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="dueDay">
                    Día de pago
                  </label>
                  <input
                    id="dueDay"
                    name="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ej: 15"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                    disabled={isSubmitting || !!successMessage}
                  />
                </div>
              </div>

              {isPastDue && (
                <div className="bg-graphite-blue/5 rounded-xl p-4 mt-4 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-graphite-blue mb-1.5">
                    Esta obligación ya venció este mes. ¿Cómo quieres registrarla?
                  </label>
                  <p className="text-xs text-graphite-blue/60 mb-3">
                    Esto evita registrar pagos duplicados si ya la pagaste antes de crearla en Nexum.
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm text-graphite-blue cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${initialStatus === 'paid' ? 'border-sage-green' : 'border-graphite-blue/30'}`}>
                        {initialStatus === 'paid' && <div className="w-2 h-2 rounded-full bg-sage-green" />}
                      </div>
                      <input 
                        type="radio" 
                        name="initialStatus" 
                        value="paid" 
                        checked={initialStatus === 'paid'} 
                        onChange={() => setInitialStatus('paid')} 
                        className="hidden" 
                      />
                      Ya la pagué este periodo
                    </label>
                    <label className="flex items-center gap-3 text-sm text-graphite-blue cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${initialStatus === 'pending' ? 'border-sage-green' : 'border-graphite-blue/30'}`}>
                        {initialStatus === 'pending' && <div className="w-2 h-2 rounded-full bg-sage-green" />}
                      </div>
                      <input 
                        type="radio" 
                        name="initialStatus" 
                        value="pending" 
                        checked={initialStatus === 'pending'} 
                        onChange={() => setInitialStatus('pending')} 
                        className="hidden" 
                      />
                      Aún está pendiente
                    </label>
                    <label className="flex items-center gap-3 text-sm text-graphite-blue cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${initialStatus === 'next_period' ? 'border-sage-green' : 'border-graphite-blue/30'}`}>
                        {initialStatus === 'next_period' && <div className="w-2 h-2 rounded-full bg-sage-green" />}
                      </div>
                      <input 
                        type="radio" 
                        name="initialStatus" 
                        value="next_period" 
                        checked={initialStatus === 'next_period'} 
                        onChange={() => setInitialStatus('next_period')} 
                        className="hidden" 
                      />
                      Empezar desde el próximo periodo
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-graphite-blue/70 hover:bg-graphite-blue/5 transition-colors"
                  disabled={isSubmitting || !!successMessage}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!successMessage}
                  className="flex-1 py-3 px-4 rounded-xl font-medium bg-graphite-blue text-white hover:bg-graphite-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {isPayModalOpen && selectedObligation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-blue/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-graphite-blue flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sage-green" />
                Registrar pago
              </h2>
              <button 
                onClick={closeModals}
                className="text-graphite-blue/40 hover:text-graphite-blue transition-colors p-1"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-graphite-blue/5 rounded-2xl p-4 mb-6">
              <p className="text-sm text-graphite-blue/60">Obligación</p>
              <p className="font-semibold text-graphite-blue mt-0.5">{selectedObligation.name}</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="mb-6 p-3 rounded-xl bg-green-50 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm text-green-700 font-medium">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="accountId">
                  Cuenta origen *
                </label>
                <select
                  id="accountId"
                  name="accountId"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors text-graphite-blue outline-none appearance-none"
                  disabled={isSubmitting || !!successMessage}
                >
                  <option value="">Selecciona con qué pagaste</option>
                  {activeAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — {formatCurrency(parseFloat(acc.balance), acc.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="amount">
                  Monto a pagar
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-blue/40 font-medium">
                    $
                  </span>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    defaultValue={parseFloat(String(selectedObligation.remaining_amount || selectedObligation.amount || "0"))}
                    readOnly={selectedObligation.payment_mode === 'fixed_full_payment'}
                    className={`w-full pl-8 pr-4 py-3 rounded-xl border-transparent focus:ring-0 transition-colors text-graphite-blue font-medium outline-none ${selectedObligation.payment_mode === 'fixed_full_payment' ? 'bg-graphite-blue/10 cursor-not-allowed opacity-80' : 'bg-graphite-blue/5 focus:bg-white focus:border-graphite-blue'}`}
                    disabled={isSubmitting || !!successMessage}
                  />
                </div>
                <p className="text-xs text-graphite-blue/40 mt-1.5">
                  {selectedObligation.payment_mode === 'fixed_full_payment' && "Esta obligación se paga por el monto completo del periodo."}
                  {selectedObligation.payment_mode === 'partial_allowed' && "Puedes hacer abonos hasta cubrir el periodo."}
                  {selectedObligation.payment_mode === 'variable_amount' && "Esta obligación permite pagos variables."}
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-graphite-blue/70 hover:bg-graphite-blue/5 transition-colors"
                  disabled={isSubmitting || !!successMessage}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!successMessage}
                  className="flex-1 py-3 px-4 rounded-xl font-medium bg-graphite-blue text-white hover:bg-graphite-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Confirmar pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

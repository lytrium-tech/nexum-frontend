'use client';

import { useState } from 'react';
import { components } from '@/lib/api/types.generated';
import { createCreditCardAction, purchaseCreditCardAction, payCreditCardAction, getCreditStatementsAction, getCreditInstallmentsAction, payEarlyPurchaseAction } from './actions';

const CreditCard = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const Plus = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const ArrowUpRight = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-10 10m0-10h10v10" /></svg>;
const ArrowDownRight = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17L7 7m10 0v10H7" /></svg>;
const Wallet = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const CheckCircle2 = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AlertCircle = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const RefreshCw = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const ChevronDown = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const ChevronUp = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
const FileText = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const Calendar = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;


type CreditCardRead = components['schemas']['CreditCardRead'];
type AccountRead = components['schemas']['AccountRead'];

interface CreditClientProps {
  initialCards: CreditCardRead[];
  initialAccounts: AccountRead[];
  initialError: string | null;
}

type CreditCardStatementRead = components['schemas']['CreditCardStatementRead'];

function StatementsList({ card, formatMoney }: { card: CreditCardRead, formatMoney: (amount: number | string | undefined, currency?: string) => string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [statements, setStatements] = useState<CreditCardStatementRead[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!isOpen && !statements && !isLoading) {
      setIsLoading(true);
      setError(null);
      const res = await getCreditStatementsAction(card.id);
      if (res.success) {
        setStatements(res.result as CreditCardStatementRead[]);
      } else {
        setError('No pudimos cargar los extractos de esta tarjeta.');
      }
      setIsLoading(false);
    }
    setIsOpen(!isOpen);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(dateString + 'T00:00:00'));
  };

  const formatPeriod = (periodString: string) => {
    const [year, month] = periodString.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <div className="mt-4 border-t border-graphite-blue/5 pt-4">
      <button 
        onClick={handleToggle}
        className="flex w-full items-center justify-between py-2 text-sm font-medium text-graphite-blue hover:text-graphite-blue/80 transition-colors"
      >
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-graphite-blue/60" />
          Extractos
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {isLoading && (
            <div className="flex justify-center py-4">
              <RefreshCw className="w-5 h-5 animate-spin text-graphite-blue/40" />
            </div>
          )}
          {error && (
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {!isLoading && !error && statements && statements.length === 0 && (
            <p className="text-sm text-graphite-blue/60 text-center py-4">
              Aún no hay extractos generados para esta tarjeta.
            </p>
          )}
          {!isLoading && !error && statements && statements.length > 0 && (
            <div className="space-y-3">
              {statements.map(stmt => (
                <div key={stmt.id} className="bg-white border border-graphite-blue/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-graphite-blue capitalize">
                        Extracto {formatPeriod(stmt.billing_period)}
                      </h4>
                      <div className="flex gap-3 text-xs text-graphite-blue/60 mt-1">
                        <span>Corte: {formatDate(stmt.cutoff_date)}</span>
                        <span>Pago: {formatDate(stmt.due_date)}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-graphite-blue/5 text-graphite-blue uppercase tracking-wider">
                      {stmt.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <p className="text-xs text-graphite-blue/50 mb-0.5">Total a pagar</p>
                      <p className="text-sm font-medium text-graphite-blue">
                        {stmt.statement_balance != null ? formatMoney(stmt.statement_balance, card.currency) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-graphite-blue/50 mb-0.5">Pago mínimo</p>
                      <p className="text-sm font-medium text-graphite-blue">
                        {stmt.minimum_payment != null ? formatMoney(stmt.minimum_payment, card.currency) : '—'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-graphite-blue/50 mb-0.5">Compras nuevas</p>
                      <p className="text-xs font-medium text-graphite-blue/80">
                        {stmt.new_purchases != null ? formatMoney(stmt.new_purchases, card.currency) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-graphite-blue/50 mb-0.5">Cuotas facturadas</p>
                      <p className="text-xs font-medium text-graphite-blue/80">
                        {stmt.billed_installments != null ? formatMoney(stmt.billed_installments, card.currency) : '—'}
                      </p>
                    </div>

                    {(parseFloat(stmt.interest_total || '0') > 0 || parseFloat(stmt.fees_total || '0') > 0) && (
                      <div className="col-span-2">
                        <p className="text-xs text-graphite-blue/50 mb-0.5">Cargos e intereses</p>
                        <p className="text-xs font-medium text-graphite-blue/80">
                          {stmt.fees_total != null ? formatMoney(stmt.fees_total, card.currency) : '—'} fees / {stmt.interest_total != null ? formatMoney(stmt.interest_total, card.currency) : '—'} int
                        </p>
                      </div>
                    )}
                    
                    {parseFloat(stmt.payments_received || '0') > 0 && (
                      <div className="col-span-2">
                        <p className="text-xs text-graphite-blue/50 mb-0.5">Pagos recibidos</p>
                        <p className="text-xs font-medium text-sage-green">
                          {stmt.payments_received != null ? formatMoney(stmt.payments_received, card.currency) : '—'}
                        </p>
                      </div>
                    )}
                  </div>

                  {stmt.frozen_at && (
                    <div className="mt-3 pt-3 border-t border-graphite-blue/5 text-xs text-graphite-blue/60 flex gap-2 items-start">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-graphite-blue/40" />
                      <p>
                        <strong className="font-medium text-graphite-blue/80">Extracto congelado.</strong> Este periodo ya fue cerrado por el backend y no se modifica con compras posteriores.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type CreditCardInstallmentRead = components['schemas']['CreditCardInstallmentRead'];

function InstallmentsList({ 
  card, 
  formatMoney, 
  onPayEarly 
}: { 
  card: CreditCardRead, 
  formatMoney: (amount: number | string | undefined, currency?: string) => string,
  onPayEarly: (installment: CreditCardInstallmentRead) => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [installments, setInstallments] = useState<CreditCardInstallmentRead[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!isOpen && !installments && !isLoading) {
      setIsLoading(true);
      setError(null);
      const res = await getCreditInstallmentsAction(card.id);
      if (res.success) {
        setInstallments(res.result as CreditCardInstallmentRead[]);
      } else {
        setError('No pudimos cargar las cuotas de esta tarjeta.');
      }
      setIsLoading(false);
    }
    setIsOpen(!isOpen);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(dateString + 'T00:00:00'));
  };

  const formatPeriod = (periodString?: string | null) => {
    if (!periodString) return '—';
    const [year, month] = periodString.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' }).format(date);
  };

  return (
    <div className="mt-0 border-t border-graphite-blue/5 pt-4">
      <button 
        onClick={handleToggle}
        className="flex w-full items-center justify-between py-2 text-sm font-medium text-graphite-blue hover:text-graphite-blue/80 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-graphite-blue/60" />
          Cuotas pendientes
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {isLoading && (
            <div className="flex justify-center py-4">
              <RefreshCw className="w-5 h-5 animate-spin text-graphite-blue/40" />
            </div>
          )}
          {error && (
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {!isLoading && !error && installments && installments.length === 0 && (
            <p className="text-sm text-graphite-blue/60 text-center py-4">
              Aún no hay compras a cuotas para esta tarjeta.
            </p>
          )}
          {!isLoading && !error && installments && installments.length > 0 && (
            <div className="space-y-3">
              {installments.map(inst => (
                <div key={inst.id} className="bg-white border border-graphite-blue/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-graphite-blue flex items-center gap-2">
                        Compra {inst.purchase_transaction_id.slice(0, 8)}
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-graphite-blue/5 text-graphite-blue uppercase tracking-wider">
                          {inst.status}
                        </span>
                      </h4>
                      <div className="flex gap-3 text-xs text-graphite-blue/60 mt-1">
                        <span>Cuota {inst.installment_number} de {inst.installments_total}</span>
                        <span>Periodo: {formatPeriod(inst.scheduled_period)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
                    <div>
                      <p className="text-xs text-graphite-blue/50 mb-0.5">Fecha programada</p>
                      <p className="text-sm font-medium text-graphite-blue">
                        {formatDate(inst.scheduled_due_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-graphite-blue/50 mb-0.5">Total de la cuota</p>
                      <p className="text-sm font-medium text-graphite-blue">
                        {inst.total_amount != null ? formatMoney(inst.total_amount, card.currency) : '—'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-graphite-blue/50 mb-0.5">Capital</p>
                      <p className="text-xs font-medium text-graphite-blue/80">
                        {inst.principal_amount != null ? formatMoney(inst.principal_amount, card.currency) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-graphite-blue/50 mb-0.5">Interés</p>
                      <p className="text-xs font-medium text-graphite-blue/80">
                        {inst.interest_amount != null ? formatMoney(inst.interest_amount, card.currency) : '—'}
                      </p>
                    </div>

                    <div className="col-span-2 pt-2 border-t border-graphite-blue/5">
                      <p className="text-xs text-graphite-blue/50 mb-0.5">Capital restante (después de cuota)</p>
                      <p className="text-sm font-medium text-graphite-blue/80">
                        {inst.remaining_principal != null ? formatMoney(inst.remaining_principal, card.currency) : '—'}
                      </p>
                    </div>
                  </div>

                  {inst.status !== 'paid' && inst.status !== 'frozen' && inst.is_pay_early_eligible !== false && (
                    <button
                      onClick={() => onPayEarly(inst)}
                      className="w-full py-2 bg-sage-green/10 text-sage-green hover:bg-sage-green/20 text-sm font-medium rounded-lg transition-colors"
                    >
                      Pagar anticipadamente
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreditClient({ initialCards, initialAccounts, initialError }: CreditClientProps) {
  const [cards] = useState<CreditCardRead[]>(initialCards);
  const [accounts] = useState<AccountRead[]>(initialAccounts);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [purchaseCard, setPurchaseCard] = useState<CreditCardRead | null>(null);
  const [paymentCard, setPaymentCard] = useState<CreditCardRead | null>(null);
  const [earlyPaymentData, setEarlyPaymentData] = useState<{ card: CreditCardRead, installment: CreditCardInstallmentRead } | null>(null);

  // States
  const [error, setError] = useState<string | null>(initialError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Formatting utilities
  const formatMoney = (amount: number | string | undefined, currency: string = 'COP') => {
    if (amount === undefined || amount === null) return '$0.00';
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency || 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      bank: formData.get('bank') as string,
      credit_limit: parseFloat(formData.get('credit_limit') as string),
      cutoff_day: parseInt(formData.get('cutoff_day') as string, 10),
      due_day: parseInt(formData.get('due_day') as string, 10),
      currency: formData.get('currency') as string || 'COP',
      management_fee: parseFloat(formData.get('management_fee') as string || '0'),
      monthly_interest_rate: parseFloat(formData.get('monthly_interest_rate') as string || '0'),
      annual_interest_rate: parseFloat(formData.get('annual_interest_rate') as string || '0'),
      network: (formData.get('network') as string) || null,
      franchise: (formData.get('franchise') as string) || null,
    };

    const result = await createCreditCardAction(data);
    
    if (result.success) {
      setSuccessMessage('Tarjeta creada exitosamente.');
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setSuccessMessage(null);
      }, 1500);
    } else {
      setError(result.error || 'Ocurrió un error al crear la tarjeta.');
    }
    
    setIsSubmitting(false);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!purchaseCard) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const description = formData.get('description') as string;
    const data = {
      amount: parseFloat(formData.get('amount') as string),
      installments_total: parseInt(formData.get('installments_total') as string, 10),
      description: description ? description : null,
      category_id: null,
      source_message_id: null,
      raw_message: null
    };

    const idempotencyKey = crypto.randomUUID();
    const result = await purchaseCreditCardAction(purchaseCard.id, data, idempotencyKey);
    
    if (result.success) {
      setSuccessMessage('Compra registrada exitosamente.');
      setTimeout(() => {
        setPurchaseCard(null);
        setSuccessMessage(null);
      }, 1500);
    } else {
      setError(result.error || 'Ocurrió un error al registrar la compra.');
    }
    
    setIsSubmitting(false);
  };

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentCard) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      account_id: formData.get('account_id') as string,
      amount: parseFloat(formData.get('amount') as string),
      source_message_id: null,
      raw_message: null
    };

    const idempotencyKey = crypto.randomUUID();
    const result = await payCreditCardAction(paymentCard.id, data, idempotencyKey);
    
    if (result.success) {
      setSuccessMessage('Pago registrado exitosamente.');
      setTimeout(() => {
        setPaymentCard(null);
        setSuccessMessage(null);
      }, 1500);
    } else {
      setError(result.error || 'Ocurrió un error al registrar el pago.');
    }
    
    setIsSubmitting(false);
  };

  const handleEarlyPaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!earlyPaymentData) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const accountId = formData.get('account_id') as string;

    const result = await payEarlyPurchaseAction(
      earlyPaymentData.card.id, 
      earlyPaymentData.installment.purchase_transaction_id, 
      accountId
    );
    
    if (result.success) {
      setSuccessMessage('Pago anticipado registrado. El backend recalculó las cuotas futuras de esta compra.');
      setTimeout(() => {
        setEarlyPaymentData(null);
        setSuccessMessage(null);
      }, 2500);
    } else {
      setError(result.error || 'No fue posible pagar esta compra anticipadamente.');
    }
    
    setIsSubmitting(false);
  };

  const activeAccounts = accounts.filter(a => a.is_active);

  return (
    <div className="min-h-screen bg-warm-white pb-20 lg:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-graphite-blue/5 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 md:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-graphite-blue flex items-center gap-2">
                <CreditCard className="w-8 h-8 text-sage-green" />
                Tarjetas de crédito
              </h1>
              <p className="mt-1.5 text-sm text-graphite-blue/60">
                Controla tu deuda, tus compras y tus pagos.
              </p>
            </div>
            
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-graphite-blue text-white text-sm font-medium rounded-xl hover:bg-graphite-blue/90 transition-colors shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Nueva tarjeta
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {initialError && (
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{initialError}</p>
          </div>
        )}

        {cards.length === 0 && !initialError ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-graphite-blue/5 shadow-sm">
            <div className="w-16 h-16 bg-sage-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-8 h-8 text-sage-green" />
            </div>
            <h3 className="text-xl font-medium text-graphite-blue mb-2">
              Aún no tienes tarjetas registradas
            </h3>
            <p className="text-graphite-blue/60 max-w-sm mx-auto mb-8">
              Agrega una tarjeta de crédito para empezar a controlar tus compras, deuda y pagos en un solo lugar.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-graphite-blue/10 text-graphite-blue text-sm font-medium rounded-xl hover:bg-graphite-blue/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar tarjeta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map(card => (
              <div key={card.id} className="bg-white rounded-3xl p-6 border border-graphite-blue/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <CreditCard className="w-24 h-24" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-medium text-graphite-blue text-lg flex items-center gap-2">
                        {card.name}
                        {!card.is_active && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-graphite-blue/10 text-graphite-blue/60 uppercase tracking-wider">
                            Inactiva
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-graphite-blue/50 mt-0.5">{card.bank}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs text-graphite-blue/50 mb-1">Deuda total</p>
                      <p className="text-2xl font-medium text-graphite-blue">
                        {formatMoney(card.total_debt ?? card.current_debt, card.currency)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-graphite-blue/50 mb-1">Deuda facturada</p>
                        <p className="text-sm font-medium text-graphite-blue/80">
                          {formatMoney(card.billed_debt, card.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-graphite-blue/50 mb-1">Deuda no facturada</p>
                        <p className="text-sm font-medium text-graphite-blue/80">
                          {formatMoney(card.unbilled_debt, card.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-graphite-blue/50 mb-1">Pago requerido</p>
                        <p className="text-sm font-medium text-graphite-blue/80">
                          {formatMoney(card.payment_required, card.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-graphite-blue/50 mb-1">Próximo estimado</p>
                        <p className="text-sm font-medium text-graphite-blue/80">
                          {formatMoney(card.next_payment_estimate, card.currency)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-graphite-blue/5">
                      <div>
                        <p className="text-xs text-graphite-blue/50 mb-1">Cupo disponible</p>
                        <p className="text-sm font-medium text-graphite-blue/80">
                          {formatMoney(card.available_credit, card.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-graphite-blue/50 mb-1">Cupo total</p>
                        <p className="text-sm font-medium text-graphite-blue/80">
                          {formatMoney(card.credit_limit, card.currency)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-graphite-blue/5">
                      <div>
                        <p className="text-xs text-graphite-blue/50 mb-1">Día de corte</p>
                        <p className="text-sm font-medium text-graphite-blue/80">
                          Día {card.cutoff_day}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-graphite-blue/50 mb-1">Día de pago</p>
                        <p className="text-sm font-medium text-graphite-blue/80">
                          Día {card.due_day}
                        </p>
                      </div>
                      {card.statement_balance != null && (
                        <div className="col-span-2">
                          <p className="text-xs text-graphite-blue/50 mb-1">Saldo de extracto</p>
                          <p className="text-sm font-medium text-graphite-blue/80">
                            {formatMoney(card.statement_balance, card.currency)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setPurchaseCard(card)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium rounded-xl transition-colors"
                      disabled={!card.is_active}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Compra
                    </button>
                    <button
                      onClick={() => setPaymentCard(card)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-sage-green/10 text-sage-green hover:bg-sage-green/20 text-sm font-medium rounded-xl transition-colors"
                      disabled={!card.is_active}
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      Pago
                    </button>
                  </div>
                  
                  <StatementsList card={card} formatMoney={formatMoney} />
                  <InstallmentsList 
                    card={card} 
                    formatMoney={formatMoney} 
                    onPayEarly={(installment) => setEarlyPaymentData({ card, installment })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals overlay */}
      {(isCreateModalOpen || purchaseCard || paymentCard || earlyPaymentData) && (
        <div className="fixed inset-0 bg-graphite-blue/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
          <div 
            className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden relative flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Create Card Modal */}
            {isCreateModalOpen && (
              <>
                <div className="p-6 sm:p-8 border-b border-graphite-blue/5 shrink-0">
                  <h2 className="text-xl font-medium text-graphite-blue flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-sage-green" />
                    Nueva tarjeta
                  </h2>
                  <p className="text-sm text-graphite-blue/60 mt-1.5">
                    Registra los datos de tu tarjeta de crédito.
                  </p>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto">
                  {error && (
                    <div className="mb-6 p-3 sm:p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {successMessage ? (
                    <div className="py-8 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-sage-green/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-sage-green" />
                      </div>
                      <p className="text-graphite-blue font-medium">{successMessage}</p>
                    </div>
                  ) : (
                    <form id="createCardForm" onSubmit={handleCreateSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="name">
                          Nombre (ej. RappiCard) *
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="bank">
                          Banco o Emisor *
                        </label>
                        <input
                          id="bank"
                          name="bank"
                          type="text"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="currency">
                          Moneda *
                        </label>
                        <select
                          id="currency"
                          name="currency"
                          required
                          defaultValue="COP"
                          className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors text-graphite-blue outline-none appearance-none"
                          disabled={isSubmitting}
                        >
                          <option value="COP">COP - Peso Colombiano</option>
                          <option value="USD">USD - Dólar Estadounidense</option>
                          <option value="EUR">EUR - Euro</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="credit_limit">
                          Cupo total *
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-blue/40 font-medium">$</span>
                          <input
                            id="credit_limit"
                            name="credit_limit"
                            type="number"
                            min="1"
                            step="0.01"
                            required
                            className="w-full pl-8 pr-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="cutoff_day">
                            Día de corte *
                          </label>
                          <input
                            id="cutoff_day"
                            name="cutoff_day"
                            type="number"
                            min="1"
                            max="31"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="due_day">
                            Día de pago *
                          </label>
                          <input
                            id="due_day"
                            name="due_day"
                            type="number"
                            min="1"
                            max="31"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="management_fee">
                            Cuota de manejo (Opcional)
                          </label>
                          <input
                            id="management_fee"
                            name="management_fee"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={0}
                            className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="monthly_interest_rate">
                            Tasa M. V. % (Opcional)
                          </label>
                          <input
                            id="monthly_interest_rate"
                            name="monthly_interest_rate"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={0}
                            className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="network">
                            Red (ej. Visa)
                          </label>
                          <input
                            id="network"
                            name="network"
                            type="text"
                            className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="franchise">
                            Franquicia
                          </label>
                          <input
                            id="franchise"
                            name="franchise"
                            type="text"
                            className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      
                      <p className="text-xs text-graphite-blue/40 mt-1.5">
                        * Tasa y cuota de manejo son opcionales pero ayudan a mejorar las estimaciones futuras.
                      </p>
                    </form>
                  )}
                </div>

                {!successMessage && (
                  <div className="p-6 sm:p-8 border-t border-graphite-blue/5 bg-graphite-blue/5 shrink-0 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-5 py-2.5 text-graphite-blue text-sm font-medium rounded-xl hover:bg-graphite-blue/10 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form="createCardForm"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-graphite-blue text-white text-sm font-medium rounded-xl hover:bg-graphite-blue/90 transition-colors disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        'Crear tarjeta'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Purchase Modal */}
            {purchaseCard && (
              <>
                <div className="p-6 sm:p-8 border-b border-graphite-blue/5 shrink-0">
                  <h2 className="text-xl font-medium text-graphite-blue flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-red-500" />
                    Registrar compra
                  </h2>
                  <p className="text-sm text-graphite-blue/60 mt-1.5">
                    Compra con <span className="font-medium text-graphite-blue">{purchaseCard.name}</span>
                  </p>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto">
                  {error && (
                    <div className="mb-6 p-3 sm:p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {successMessage ? (
                    <div className="py-8 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-sage-green/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-sage-green" />
                      </div>
                      <p className="text-graphite-blue font-medium">{successMessage}</p>
                    </div>
                  ) : (
                    <form id="purchaseForm" onSubmit={handlePurchaseSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="amount">
                          Monto de la compra *
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-blue/40 font-medium">$</span>
                          <input
                            id="amount"
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            className="w-full pl-8 pr-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="installments_total">
                          Número de cuotas *
                        </label>
                        <input
                          id="installments_total"
                          name="installments_total"
                          type="number"
                          min="1"
                          defaultValue={1}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="description">
                          Descripción (opcional)
                        </label>
                        <input
                          id="description"
                          name="description"
                          type="text"
                          placeholder="Ej. Cena restaurante"
                          className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                          disabled={isSubmitting}
                        />
                      </div>
                    </form>
                  )}
                </div>

                {!successMessage && (
                  <div className="p-6 sm:p-8 border-t border-graphite-blue/5 bg-graphite-blue/5 shrink-0 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setPurchaseCard(null)}
                      className="px-5 py-2.5 text-graphite-blue text-sm font-medium rounded-xl hover:bg-graphite-blue/10 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form="purchaseForm"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        'Registrar compra'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Payment Modal */}
            {paymentCard && (
              <>
                <div className="p-6 sm:p-8 border-b border-graphite-blue/5 shrink-0">
                  <h2 className="text-xl font-medium text-graphite-blue flex items-center gap-2">
                    <ArrowDownRight className="w-5 h-5 text-sage-green" />
                    Registrar pago de tarjeta
                  </h2>
                  <p className="text-sm text-graphite-blue/60 mt-1.5">
                    Paga la deuda de <span className="font-medium text-graphite-blue">{paymentCard.name}</span>
                  </p>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto">
                  {error && (
                    <div className="mb-6 p-3 sm:p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {successMessage ? (
                    <div className="py-8 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-sage-green/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-sage-green" />
                      </div>
                      <p className="text-graphite-blue font-medium">{successMessage}</p>
                    </div>
                  ) : (
                    <form id="paymentForm" onSubmit={handlePaymentSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="account_id">
                          Cuenta origen *
                        </label>
                        {activeAccounts.length === 0 ? (
                          <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">No tienes cuentas bancarias activas disponibles para realizar el pago.</p>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Wallet className="h-5 w-5 text-graphite-blue/40" />
                            </div>
                            <select
                              id="account_id"
                              name="account_id"
                              required
                              className="w-full pl-11 pr-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors appearance-none outline-none text-graphite-blue"
                              disabled={isSubmitting}
                            >
                              <option value="">Selecciona una cuenta</option>
                              {activeAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.name} (Saldo: {formatMoney(account.balance, account.currency)})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="amount">
                          Monto a pagar *
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-blue/40 font-medium">$</span>
                          <input
                            id="amount"
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            className="w-full pl-8 pr-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                            disabled={isSubmitting}
                          />
                        </div>
                        <p className="text-xs text-graphite-blue/50 mt-1.5">
                          Deuda facturada: {formatMoney(paymentCard.billed_debt, paymentCard.currency)} | Deuda actual: {formatMoney(paymentCard.current_debt, paymentCard.currency)}
                        </p>
                      </div>
                    </form>
                  )}
                </div>

                {!successMessage && (
                  <div className="p-6 sm:p-8 border-t border-graphite-blue/5 bg-graphite-blue/5 shrink-0 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentCard(null)}
                      className="px-5 py-2.5 text-graphite-blue text-sm font-medium rounded-xl hover:bg-graphite-blue/10 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form="paymentForm"
                      disabled={isSubmitting || activeAccounts.length === 0}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-sage-green text-white text-sm font-medium rounded-xl hover:bg-[#688c74] transition-colors disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Registrar pago'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Early Payment Modal */}
            {earlyPaymentData && (
              <>
                <div className="p-6 sm:p-8 border-b border-graphite-blue/5 shrink-0">
                  <h2 className="text-xl font-medium text-graphite-blue flex items-center gap-2">
                    <ArrowDownRight className="w-5 h-5 text-sage-green" />
                    Pagar anticipadamente
                  </h2>
                  <p className="text-sm text-graphite-blue/60 mt-1.5 capitalize">
                    {earlyPaymentData.card.name}
                  </p>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto">
                  {error && (
                    <div className="mb-6 p-3 sm:p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {successMessage ? (
                    <div className="py-8 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-sage-green/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-sage-green" />
                      </div>
                      <p className="text-graphite-blue font-medium">{successMessage}</p>
                    </div>
                  ) : (
                    <form id="earlyPaymentForm" onSubmit={handleEarlyPaymentSubmit} className="space-y-5">
                      <div className="p-4 bg-graphite-blue/5 rounded-xl text-sm text-graphite-blue/80 space-y-2 mb-4 border border-graphite-blue/10">
                        <p>
                          Vas a solicitar un pago anticipado para la compra <span className="font-medium">{earlyPaymentData.installment.purchase_transaction_id.slice(0, 8)}</span>.
                        </p>
                        <p>
                          Nexum usará el backend para calcular el monto exacto y recalcular las cuotas futuras. Selecciona la cuenta desde donde quieres pagar.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="account_id">
                          Cuenta origen *
                        </label>
                        {activeAccounts.length === 0 ? (
                          <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">No hay cuentas disponibles para realizar este pago.</p>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Wallet className="h-5 w-5 text-graphite-blue/40" />
                            </div>
                            <select
                              id="account_id"
                              name="account_id"
                              required
                              className="w-full pl-11 pr-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors appearance-none outline-none text-graphite-blue"
                              disabled={isSubmitting}
                            >
                              <option value="">Selecciona una cuenta</option>
                              {activeAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.name} (Saldo: {formatMoney(account.balance, account.currency)})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </form>
                  )}
                </div>

                {!successMessage && (
                  <div className="p-6 sm:p-8 border-t border-graphite-blue/5 bg-graphite-blue/5 shrink-0 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEarlyPaymentData(null)}
                      className="px-5 py-2.5 text-graphite-blue text-sm font-medium rounded-xl hover:bg-graphite-blue/10 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form="earlyPaymentForm"
                      disabled={isSubmitting || activeAccounts.length === 0}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-sage-green text-white text-sm font-medium rounded-xl hover:bg-[#688c74] transition-colors disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Confirmar pago anticipado'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

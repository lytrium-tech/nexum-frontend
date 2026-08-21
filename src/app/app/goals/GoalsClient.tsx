'use client';

import { useState, useEffect } from 'react';
import { components } from '@/lib/api/types.generated';
import { createGoalAction, contributeGoalAction, getGoalDetailAction, releaseGoalAction } from './actions';
import { formatMoneyOrDash } from '@/lib/format/money';
import { AutoContributionModal } from './components/AutoContributionModal';

const Target = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22a10 10 0 110-20 10 10 0 010 20z M12 16a4 4 0 110-8 4 4 0 010 8z M12 12a1 1 0 110-2 1 1 0 010 2z" /></svg>;
const Plus = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const TrendingUp = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const AlertCircle = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const X = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const PiggyBank = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const Calendar = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ArrowRight = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
const Unlock = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>;
const Settings = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

type GoalRead = components['schemas']['GoalRead'];
type GoalDetailRead = components['schemas']['GoalDetailRead'];
type AccountRead = components['schemas']['AccountRead'];

interface GoalsClientProps {
  initialGoals: GoalRead[];
  accounts: AccountRead[];
}

export default function GoalsClient({ initialGoals, accounts }: GoalsClientProps) {
  const [goals, setGoals] = useState<GoalRead[]>(initialGoals);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isAutoContributionModalOpen, setIsAutoContributionModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalRead | null>(null);
  const [selectedGoalForRelease, setSelectedGoalForRelease] = useState<GoalRead | null>(null);
  const [detailedGoal, setDetailedGoal] = useState<GoalDetailRead | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [releaseAccountId, setReleaseAccountId] = useState('');
  const [releaseAmount, setReleaseAmount] = useState('');

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<React.ReactNode | null>(null);

  // Active only logic
  const activeGoals = goals.filter(g => g.is_active);

  const openContributeModal = (goal: GoalRead) => {
    setSelectedGoal(goal);
    setIsContributeModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const openAutoContributionModal = (goal: GoalRead) => {
    setSelectedGoal(goal);
    setIsAutoContributionModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const openReleaseModal = async (goal: GoalRead) => {
    setSelectedGoalForRelease(goal);
    setDetailedGoal(null);
    setReleaseAccountId('');
    setReleaseAmount('');
    setIsReleaseModalOpen(true);
    setManageLoading(true);
    setError(null);
    setSuccessMessage(null);

    const res = await getGoalDetailAction(goal.id);
    if (res.success && res.result) {
      setDetailedGoal(res.result);
    } else {
      setError(res.error || 'No pudimos cargar los detalles de la meta.');
    }
    setManageLoading(false);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsContributeModalOpen(false);
    setIsReleaseModalOpen(false);
    setIsAutoContributionModalOpen(false);
    setSelectedGoal(null);
    setSelectedGoalForRelease(null);
    setDetailedGoal(null);
    setReleaseAccountId('');
    setReleaseAmount('');
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModals();
      }
    };
    if (isCreateModalOpen || isContributeModalOpen || isReleaseModalOpen || isAutoContributionModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, isContributeModalOpen, isReleaseModalOpen, isAutoContributionModalOpen]);

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const targetAmountStr = formData.get('targetAmount') as string;
    const targetDateStr = formData.get('targetDate') as string;
    const currency = formData.get('currency') as string || 'COP';

    const target_amount = parseFloat(targetAmountStr.replace(',', '.'));
    if (isNaN(target_amount) || target_amount <= 0) {
      setError('El monto objetivo debe ser mayor a 0');
      setIsSubmitting(false);
      return;
    }

    if (!name.trim()) {
      setError('El nombre es requerido');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: name.trim(),
      target_amount: target_amount,
      target_date: targetDateStr || undefined,
      currency: currency,
    };

    const res = await createGoalAction(payload);
    
    if (res.success && res.result) {
      setGoals([...goals, res.result]);
      setSuccessMessage('Meta creada exitosamente.');
      setTimeout(() => {
        closeModals();
      }, 1500);
    } else {
      setError(res.error || 'Ocurrió un error al crear la meta');
      setIsSubmitting(false);
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGoal) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const accountId = formData.get('accountId') as string;
    const amountStr = formData.get('amount') as string;

    const amount = parseFloat(amountStr.replace(',', '.'));
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

    const sourceAccount = accounts.find(a => a.id === accountId);
    if (!sourceAccount) {
      setError('Cuenta de origen no encontrada');
      setIsSubmitting(false);
      return;
    }

    const available = parseFloat((sourceAccount.available_balance ?? sourceAccount.balance) || '0');
    if (amount > available) {
      setError('El monto supera tu disponibilidad. Intenta con un monto menor o revisa el saldo disponible de tu cuenta.');
      setIsSubmitting(false);
      return;
    }

    const currency = sourceAccount.currency || 'COP';

    const payload = {
      account_id: accountId,
      amount,
      currency
    };

    // basic idempotency key just for client deduplication per session submit
    const idemKey = crypto.randomUUID();

    const res = await contributeGoalAction(selectedGoal.id, payload, idemKey);
    
    if (res.success && res.result) {
      // Optimistic update of the local goals list
      const updatedGoals = goals.map(g => {
        if (g.id === selectedGoal.id && res.result) {
          return {
            ...g,
            current_amount: res.result.goal_current_amount,
            progress_percentage: res.result.progress_percentage || g.progress_percentage
          };
        }
        return g;
      });
      setGoals(updatedGoals);

      const cr = res.result;
      const sourceAccountName = sourceAccount?.name || 'la cuenta';
      let messageContent: React.ReactNode;
      if (cr.goal_currency && cr.currency && cr.currency !== cr.goal_currency) {
        messageContent = (
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Aportaste {formatMoneyOrDash(cr.amount, cr.currency)} a {selectedGoal.name} desde {sourceAccountName}.</span>
            <span>{cr.is_estimated ? '≈ ' : ''}{formatMoneyOrDash(cr.applied_amount, cr.goal_currency)} aplicados a tu meta</span>
            {cr.fx_rate && (
              <span className="text-xs opacity-80 mt-1">
                Tasa usada: 1 {cr.currency} = {formatMoneyOrDash(cr.fx_rate, cr.goal_currency)}
              </span>
            )}
          </div>
        );
      } else {
        messageContent = `Aportaste ${formatMoneyOrDash(cr.amount, cr.currency || 'COP')} a ${selectedGoal.name} desde ${sourceAccountName}.`;
      }

      setSuccessMessage(messageContent);
      setTimeout(() => {
        closeModals();
      }, 3000);
    } else {
      setError(res.error || 'Ocurrió un error al registrar el aporte');
      setIsSubmitting(false);
    }
  };

  const handleReleaseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!detailedGoal || !releaseAccountId) return;
    const selectedRes = detailedGoal.reservations_by_account?.find(r => r.account_id === releaseAccountId);
    if (!selectedRes || !selectedRes.is_releasable) {
      setError('La reserva seleccionada no es elegible para liberación.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const amountStr = formData.get('releaseAmount') as string;

    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser mayor a 0');
      setIsSubmitting(false);
      return;
    }

    const maxAllowed = parseFloat(selectedRes.reserved_amount || '0');
    if (amount > maxAllowed) {
      setError('El monto supera el dinero reservado en esta cuenta.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      account_id: releaseAccountId,
      amount
    };

    // basic idempotency key just for client deduplication per session submit
    const idemKey = crypto.randomUUID();

    const res = await releaseGoalAction(detailedGoal.id, payload, idemKey);

    if (res.success && res.result) {
      // NOTE: NO frontend optimistic finance.
      // The backend/refetch será quien actualice los valores.
      const cr = res.result;

      const messageContent = `Liberaste ${formatMoneyOrDash(cr.released_amount, cr.source_currency || 'COP')} de ${detailedGoal.name} hacia ${selectedRes.account_name}.`;

      setSuccessMessage(messageContent);
      setTimeout(() => {
        closeModals();
      }, 3000);
    } else {
      setError(res.error || 'Ocurrió un error al liberar el dinero');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-graphite-blue">Metas</h1>
          <p className="text-graphite-blue/60 mt-1">
            Convierte tu dinero en objetivos claros.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-graphite-blue text-white px-5 py-2.5 rounded-full font-medium shadow-sm hover:bg-graphite-blue/90 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva meta</span>
        </button>
      </div>

      {/* Goal List */}
      {activeGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-graphite-blue/10 shadow-sm mt-8">
          <div className="w-16 h-16 bg-sage-green/20 rounded-full flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-sage-green" />
          </div>
          <h3 className="text-xl font-medium text-graphite-blue mb-2">Aún no tienes metas</h3>
          <p className="text-graphite-blue/60 max-w-sm mb-6">
            Crea una meta para empezar a separar dinero hacia algo importante.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-sage-green font-medium hover:text-sage-green/80 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Crear mi primera meta</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {activeGoals.map(goal => {
            const isCompleted = goal.status === 'completed';

            const formatVal = (val: string | null | undefined) => formatMoneyOrDash(val, goal.currency || 'COP');

            const periodStatusLabels: Record<string, string> = {
              pending: 'Pendiente',
              partial: 'Parcial',
              covered: 'Cubierta',
              paid: 'Cubierta',
              overdue: 'Atrasada',
              flexible: 'Flexible'
            };

            const periodStatusHuman = goal.period_status ? (periodStatusLabels[goal.period_status] || goal.period_status) : '—';
            const progressVal = goal.progress_percentage != null ? parseFloat(goal.progress_percentage) : null;
            const displayProgress = progressVal !== null && !isNaN(progressVal) ? Math.min(Math.max(progressVal, 0), 100) : null;

            return (
              <div 
                key={goal.id} 
                className="bg-white rounded-3xl p-6 border border-graphite-blue/10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between"
              >
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Target className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                </div>

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-champagne-gold/30 text-graphite-blue'}`}>
                        {isCompleted ? <Target className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-graphite-blue truncate max-w-[200px]">{goal.name}</h3>
                        {goal.target_date ? (
                          <div className="flex items-center gap-1.5 text-xs text-graphite-blue/50 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(goal.target_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-graphite-blue/50 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 opacity-50" />
                            <span>Sin fecha objetivo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 mb-2 flex justify-between items-end">
                    <div>
                      <p className="text-sm font-medium text-graphite-blue/60 mb-1">Acumulado</p>
                      <p className="text-2xl font-semibold text-graphite-blue flex items-baseline gap-1">
                        {formatVal(goal.current_amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-graphite-blue/50 mb-1">Objetivo</p>
                      <p className="text-sm font-medium text-graphite-blue">
                        {formatVal(goal.target_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-graphite-blue/5 rounded-full h-2.5 mt-4 overflow-hidden relative">
                    {displayProgress !== null && (
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500' : 'bg-sage-green'}`}
                        style={{ width: `${displayProgress}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between items-start mt-2">
                    <p className="text-xs font-medium text-graphite-blue/50">
                      {goal.progress_percentage != null ? `${parseFloat(goal.progress_percentage).toFixed(1)}% completado` : '—'}
                    </p>
                    {goal.is_flexible ? (
                      <p className="text-xs text-graphite-blue/40 font-medium text-right">Aporta cuando quieras</p>
                    ) : (
                      <div className="text-right">
                        <p className="text-xs text-graphite-blue/40">
                          Req. mensual: {formatVal(goal.monthly_required)}
                        </p>
                        {goal.daily_required_this_period && parseFloat(goal.daily_required_this_period) > 0 && (
                          <p className="text-xs text-graphite-blue/40 mt-0.5">
                            Para llegar a tiempo: {formatVal(goal.daily_required_this_period)} diarios
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Period info if not flexible */}
                  {!goal.is_flexible && (
                    <div className="mt-4 pt-4 border-t border-graphite-blue/5 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-graphite-blue/50 block">Estado Periodo:</span>
                        <span className="font-medium text-graphite-blue">{periodStatusHuman}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-graphite-blue/50 block">Restante Periodo:</span>
                        <span className="font-medium text-graphite-blue">{formatVal(goal.remaining_required_this_period)}</span>
                      </div>
                    </div>
                  )}

                  {/* Auto Contribution Entry */}
                  <div className="mt-4 pt-4 border-t border-graphite-blue/5 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-graphite-blue/70">
                      <Settings className="w-3.5 h-3.5" />
                      <span>Aportes automáticos</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAutoContributionModal(goal)}
                      className="text-sage-green font-medium hover:text-sage-green/80 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Administrar <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-graphite-blue/5 flex gap-3">
                  {!isCompleted && goal.status !== 'archived' && goal.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => openReleaseModal(goal)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2
                        bg-white border border-graphite-blue/10 text-graphite-blue hover:bg-graphite-blue/5 cursor-pointer`}
                    >
                      <Unlock className="w-4 h-4" />
                      Liberar
                    </button>
                  )}
                  {isCompleted && (
                    <button
                      type="button"
                      onClick={() => openReleaseModal(goal)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2
                        bg-white border border-graphite-blue/10 text-graphite-blue hover:bg-graphite-blue/5 cursor-pointer`}
                    >
                      <Unlock className="w-4 h-4" />
                      Liberar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openContributeModal(goal)}
                    disabled={isCompleted}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2
                      ${isCompleted 
                        ? 'bg-graphite-blue/5 text-graphite-blue/40 cursor-not-allowed' 
                        : 'bg-graphite-blue/5 text-graphite-blue hover:bg-graphite-blue hover:text-white cursor-pointer'}`}
                  >
                    <PiggyBank className="w-4 h-4" />
                    {isCompleted ? 'Completada' : 'Aportar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-blue/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-graphite-blue flex items-center gap-2">
                <Target className="w-5 h-5 text-sage-green" />
                Nueva meta
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
              <div className="mb-6 p-4 rounded-xl bg-green-50 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                <div className="text-sm text-green-700 font-medium">{successMessage}</div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="name">
                  ¿Qué quieres lograr? *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ej: Viaje a Japón, MacBook Pro"
                  className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                  disabled={isSubmitting || !!successMessage}
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
                  disabled={isSubmitting || !!successMessage}
                >
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="USD">USD - Dólar Estadounidense</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="targetAmount">
                  Monto objetivo *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-blue/40 font-medium">
                    $
                  </span>
                  <input
                    id="targetAmount"
                    name="targetAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                    disabled={isSubmitting || !!successMessage}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="targetDate">
                  Fecha límite (opcional)
                </label>
                <input
                  id="targetDate"
                  name="targetDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors text-graphite-blue outline-none"
                  disabled={isSubmitting || !!successMessage}
                />
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
                  ) : 'Crear meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Goal Modal */}
      {isContributeModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-blue/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-graphite-blue flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-sage-green" />
                Aportar a meta
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
              <p className="text-sm text-graphite-blue/60">Meta seleccionada</p>
              <p className="font-semibold text-graphite-blue mt-0.5">{selectedGoal.name}</p>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-graphite-blue/50">Progreso actual</span>
                <span className="font-medium text-graphite-blue">{formatMoneyOrDash(selectedGoal.current_amount, 'COP')}</span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-green-50 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                <div className="text-sm text-green-700 font-medium">{successMessage}</div>
              </div>
            )}

            <form onSubmit={handleContributeSubmit} className="space-y-4">
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
                  <option value="">Selecciona una cuenta</option>
                  {accounts.filter(a => a.is_active !== false && String(a.is_active) !== 'false').map(acc => {
                    const available = acc.available_balance ?? acc.balance;
                    const isZero = parseFloat(available || '0') <= 0;
                    return (
                      <option key={acc.id} value={acc.id} disabled={isZero}>
                        {acc.name} — Disponible: {formatMoneyOrDash(available, acc.currency)} {isZero ? '(Sin saldo disponible)' : `(Saldo bruto: ${formatMoneyOrDash(acc.balance, acc.currency)})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="amount">
                  Monto a aportar *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-blue/40 font-medium">
                    $
                  </span>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                    disabled={isSubmitting || !!successMessage}
                  />
                </div>
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
                  ) : 'Confirmar aporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Release Goal Modal */}
      {isReleaseModalOpen && selectedGoalForRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-blue/20 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-graphite-blue flex items-center gap-2">
                <Unlock className="w-5 h-5 text-sage-green" />
                Liberar dinero
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
              <p className="text-sm text-graphite-blue/60">Meta seleccionada</p>
              <p className="font-semibold text-graphite-blue mt-0.5">{selectedGoalForRelease.name}</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {manageLoading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-graphite-blue/10 border-t-graphite-blue rounded-full animate-spin mb-4" />
                <p className="text-sm text-graphite-blue/60">Cargando detalles...</p>
              </div>
            ) : detailedGoal ? (
              !detailedGoal.reservations_by_account || !detailedGoal.reservations_by_account.some(r => parseFloat(r.reserved_amount || '0') > 0) ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-graphite-blue/5 rounded-full flex items-center justify-center mb-4">
                    <Unlock className="w-6 h-6 text-graphite-blue/40" />
                  </div>
                  <p className="text-graphite-blue font-medium mb-1">Sin reservas</p>
                  <p className="text-sm text-graphite-blue/60 mb-6 max-w-[250px]">
                    Esta meta todavía no tiene dinero reservado para liberar.
                  </p>
                  <button
                    onClick={closeModals}
                    autoFocus
                    className="w-full py-3 px-4 rounded-xl font-medium bg-graphite-blue/5 text-graphite-blue hover:bg-graphite-blue/10 transition-colors"
                  >
                    Volver
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReleaseSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="releaseAccountId">
                      Cuenta de origen *
                    </label>
                    <p className="text-xs text-graphite-blue/50 mb-2">
                      El dinero volverá a estar disponible en esta cuenta.
                    </p>
                    <select
                      id="releaseAccountId"
                      name="releaseAccountId"
                      required
                      autoFocus
                      value={releaseAccountId}
                      onChange={(e) => setReleaseAccountId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors text-graphite-blue outline-none appearance-none"
                      disabled={isSubmitting || !!successMessage}
                    >
                      <option value="">Selecciona una cuenta</option>
                      {detailedGoal.reservations_by_account?.filter(r => parseFloat(r.reserved_amount || '0') > 0).map(res => {
                        const isDisabled = !res.is_releasable;
                        let label = `${res.account_name} — Reserva disponible: ${formatMoneyOrDash(res.reserved_amount, res.account_currency)}`;
                        if (isDisabled) {
                          if (res.release_block_reason === 'currency_mismatch_legacy') {
                            label += ' (Bloqueada: Moneda distinta)';
                          } else if (res.release_block_reason === 'account_inactive') {
                            label += ' (Bloqueada: Cuenta inactiva)';
                          } else {
                            label += ' (Bloqueada)';
                          }
                        }
                        return (
                          <option key={res.account_id} value={res.account_id} disabled={isDisabled}>
                            {label}
                          </option>
                        );
                      })}
                    </select>

                    {detailedGoal.reservations_by_account?.some(r => !r.is_releasable && parseFloat(r.reserved_amount || '0') > 0) && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2 items-start" aria-live="polite">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-700 font-medium">
                          Algunas reservas no se pueden liberar automáticamente:
                          <ul className="list-disc ml-5 mt-1 text-xs opacity-90">
                            {detailedGoal.reservations_by_account.some(r => r.release_block_reason === 'account_inactive' && parseFloat(r.reserved_amount || '0') > 0) && (
                              <li>Cuenta inactiva (actívala en Cuentas para liberar).</li>
                            )}
                            {detailedGoal.reservations_by_account.some(r => r.release_block_reason === 'currency_mismatch_legacy' && parseFloat(r.reserved_amount || '0') > 0) && (
                              <li>Diferencia de moneda (incompatibilidad legacy).</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5" htmlFor="releaseAmount">
                      Monto a liberar {releaseAccountId ? `(${detailedGoal.reservations_by_account?.find(r => r.account_id === releaseAccountId)?.account_currency})` : ''} *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-blue/40 font-medium">
                        $
                      </span>
                      <input
                        id="releaseAmount"
                        name="releaseAmount"
                        type="number"
                        min="0.01"
                        max={releaseAccountId && detailedGoal.reservations_by_account ? detailedGoal.reservations_by_account.find(r => r.account_id === releaseAccountId)?.reserved_amount : undefined}
                        step="0.01"
                        required
                        value={releaseAmount}
                        onChange={(e) => setReleaseAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
                        disabled={isSubmitting || !!successMessage || !releaseAccountId}
                      />
                    </div>
                    {releaseAccountId && detailedGoal.reservations_by_account && (() => {
                      const selectedRes = detailedGoal.reservations_by_account.find(r => r.account_id === releaseAccountId);
                      if (selectedRes && selectedRes.applied_reserved_amount !== selectedRes.reserved_amount && selectedRes.goal_currency) {
                        return (
                          <p className="text-xs text-graphite-blue/50 mt-1.5">
                            Esta reserva equivale a {formatMoneyOrDash(selectedRes.applied_reserved_amount, selectedRes.goal_currency)} en el progreso de la meta.
                          </p>
                        );
                      }
                      return null;
                    })()}
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
                      disabled={isSubmitting || !!successMessage || !detailedGoal.reservations_by_account?.some(r => r.is_releasable && parseFloat(r.reserved_amount || '0') > 0)}
                      className="flex-1 py-3 px-4 rounded-xl font-medium bg-graphite-blue text-white hover:bg-graphite-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                      Continuar
                    </button>
                  </div>
                </form>
              )
            ) : null}
          </div>
        </div>
      )}

      {/* Auto Contribution Modal */}
      {isAutoContributionModalOpen && selectedGoal && (
        <AutoContributionModal
          goal={selectedGoal}
          accounts={accounts}
          onClose={closeModals}
        />
      )}
    </div>
  );
}

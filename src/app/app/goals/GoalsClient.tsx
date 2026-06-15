'use client';

import { useState } from 'react';
import { components } from '@/lib/api/types.generated';
import { createGoalAction, contributeGoalAction } from './actions';
const formatCurrency = (val: number | string, currency = 'COP') => new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(Number(val));

const Target = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22a10 10 0 110-20 10 10 0 010 20z M12 16a4 4 0 110-8 4 4 0 010 8z M12 12a1 1 0 110-2 1 1 0 010 2z" /></svg>;
const Plus = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const TrendingUp = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const AlertCircle = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const X = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const PiggyBank = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const Calendar = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ChevronRight = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const ArrowRight = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;

type GoalRead = components['schemas']['GoalRead'];
type AccountRead = components['schemas']['AccountRead'];

interface GoalsClientProps {
  initialGoals: GoalRead[];
  accounts: AccountRead[];
}

export default function GoalsClient({ initialGoals, accounts }: GoalsClientProps) {
  const [goals, setGoals] = useState<GoalRead[]>(initialGoals);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalRead | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active only logic
  const activeGoals = goals.filter(g => g.is_active);

  const openContributeModal = (goal: GoalRead) => {
    setSelectedGoal(goal);
    setIsContributeModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsContributeModalOpen(false);
    setSelectedGoal(null);
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const targetAmountStr = formData.get('targetAmount') as string;
    const targetDateStr = formData.get('targetDate') as string;

    const target_amount = parseFloat(targetAmountStr);
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
      target_amount,
      target_date: targetDateStr || undefined
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

    const payload = {
      account_id: accountId,
      amount
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
      setSuccessMessage('Aporte registrado exitosamente.');
      setTimeout(() => {
        closeModals();
      }, 1500);
    } else {
      setError(res.error || 'Ocurrió un error al registrar el aporte');
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
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-graphite-blue text-white px-5 py-2.5 rounded-full font-medium shadow-sm hover:bg-graphite-blue/90 transition-all active:scale-95 flex items-center gap-2"
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
            onClick={() => setIsCreateModalOpen(true)}
            className="text-sage-green font-medium hover:text-sage-green/80 flex items-center gap-1 transition-colors"
          >
            <span>Crear mi primera meta</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {activeGoals.map(goal => {
            const currentAmount = parseFloat(goal.current_amount);
            const targetAmount = parseFloat(goal.target_amount);
            const progressVal = goal.progress_percentage 
              ? parseFloat(goal.progress_percentage)
              : targetAmount > 0 
                ? (currentAmount / targetAmount) * 100 
                : 0;
                
            const displayProgress = Math.min(Math.max(progressVal, 0), 100);
            const isCompleted = displayProgress >= 100 || goal.status === 'completed';

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
                        {formatCurrency(currentAmount, 'COP')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-graphite-blue/50 mb-1">Objetivo</p>
                      <p className="text-sm font-medium text-graphite-blue">
                        {formatCurrency(targetAmount, 'COP')}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-graphite-blue/5 rounded-full h-2.5 mt-4 overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500' : 'bg-sage-green'}`}
                      style={{ width: `${displayProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs font-medium text-graphite-blue/50">
                      {displayProgress.toFixed(1)}% completado
                    </p>
                    {!goal.target_date && !isCompleted ? (
                      <p className="text-xs text-graphite-blue/40 font-medium">Aporte flexible</p>
                    ) : goal.monthly_required && !isCompleted ? (
                      <p className="text-xs text-graphite-blue/40">
                        Req. mensual: {formatCurrency(parseFloat(goal.monthly_required), 'COP')}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-graphite-blue/5 flex gap-3">
                  <button
                    onClick={() => openContributeModal(goal)}
                    disabled={isCompleted}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2
                      ${isCompleted 
                        ? 'bg-graphite-blue/5 text-graphite-blue/40 cursor-not-allowed' 
                        : 'bg-graphite-blue/5 text-graphite-blue hover:bg-graphite-blue hover:text-white'}`}
                  >
                    <PiggyBank className="w-4 h-4" />
                    {isCompleted ? 'Completada' : 'Aportar'}
                  </button>
                  <button className="p-2 rounded-xl bg-white border border-graphite-blue/10 text-graphite-blue/60 hover:text-graphite-blue hover:bg-graphite-blue/5 transition-colors">
                    <ChevronRight className="w-4 h-4" />
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
              <div className="mb-6 p-3 rounded-xl bg-green-50 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm text-green-700 font-medium">{successMessage}</p>
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
                    min="1"
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
                <span className="font-medium text-graphite-blue">{formatCurrency(parseFloat(selectedGoal.current_amount), 'COP')}</span>
              </div>
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
                  {accounts.filter(a => a.is_active).map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — {formatCurrency(parseFloat(acc.balance), acc.currency)}
                    </option>
                  ))}
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
                    min="1"
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
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { components } from '@/lib/api/types.generated';
import { 
  getGoalAutoContributionAction,
  configureGoalAutoContributionAction,
  updateGoalAutoContributionAction
} from '../actions';
import { formatMoneyOrDash } from '@/lib/format/money';

const X = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const Settings = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const AlertCircle = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ArrowLeft = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;

type GoalAutoContributionScheduleRead = components['schemas']['GoalAutoContributionScheduleRead'];
type GoalAutoContributionScheduleCreate = components['schemas']['GoalAutoContributionScheduleCreate'];
type GoalAutoContributionScheduleUpdate = components['schemas']['GoalAutoContributionScheduleUpdate'];
type AccountRead = components['schemas']['AccountRead'];
type GoalRead = components['schemas']['GoalRead'];
type Frequency = 'weekly' | 'monthly';

interface Props {
  goal: GoalRead;
  accounts: AccountRead[];
  onClose: () => void;
}

const WEEKDAYS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

export function AutoContributionModal({ goal, accounts, onClose }: Props) {
  const [schedule, setSchedule] = useState<GoalAutoContributionScheduleRead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [accountId, setAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [executionDay, setExecutionDay] = useState<string>('1');

  // Filter valid accounts: must be active and same currency
  const validAccounts = accounts.filter(a => a.is_active && a.currency === goal.currency);

  useEffect(() => {
    let mounted = true;
    async function fetchSchedule() {
      setIsLoading(true);
      setError(null);
      const res = await getGoalAutoContributionAction(goal.id);
      if (mounted) {
        if (res.success) {
          setSchedule(res.result as GoalAutoContributionScheduleRead | null);
        } else {
          setError(res.error || 'Ocurrió un error inesperado');
        }
        setIsLoading(false);
      }
    }
    fetchSchedule();
    return () => { mounted = false; };
  }, [goal.id]);

  const handleEditClick = () => {
    if (schedule) {
      setAccountId(schedule.account_id);
      setAmount(schedule.amount);
      setFrequency(schedule.frequency as Frequency);
      setExecutionDay(schedule.execution_day);
    } else {
      setAccountId(validAccounts.length > 0 ? validAccounts[0].id : '');
      setAmount('');
      setFrequency('monthly');
      setExecutionDay('1');
    }
    setIsEditing(true);
    setError(null);
    setSuccessMsg(null);
  };

  const handleFrequencyChange = (newFreq: Frequency) => {
    setFrequency(newFreq);
    if (newFreq === 'weekly') {
      setExecutionDay('monday');
    } else {
      setExecutionDay('1');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    if (schedule) {
      // Edit
      const payload: GoalAutoContributionScheduleUpdate = {
        account_id: accountId,
        amount: amount,
        frequency: frequency,
        execution_day: executionDay,
        timezone: tz,
      };

      const res = await updateGoalAutoContributionAction(goal.id, payload);
      if (res.success) {
        setSchedule(res.result as GoalAutoContributionScheduleRead);
        setSuccessMsg('Configuración actualizada.');
        setIsEditing(false);
      } else {
        setError(res.error || 'Ocurrió un error inesperado al actualizar.');
      }
    } else {
      // Create
      const payload: GoalAutoContributionScheduleCreate = {
        account_id: accountId,
        amount: amount,
        frequency: frequency,
        execution_day: executionDay,
        timezone: tz,
      };

      const res = await configureGoalAutoContributionAction(goal.id, payload);
      if (res.success) {
        setSchedule(res.result as GoalAutoContributionScheduleRead);
        setSuccessMsg('Aportes automáticos activados.');
        setIsEditing(false);
      } else {
        setError(res.error || 'Ocurrió un error inesperado al guardar.');
      }
    }
    setIsSubmitting(false);
  };

  const getAccountName = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.name : 'Cuenta desconocida';
  };

  const getPauseReasonLabel = (reason?: string | null) => {
    switch (reason) {
      case 'user_paused': return 'Pausado por ti';
      case 'goal_completed': return 'Meta completada';
      case 'account_inactive': return 'Cuenta no disponible';
      case 'goal_archived': return 'Meta archivada';
      default: return reason || '';
    }
  };

  const formatFrequency = (sch: GoalAutoContributionScheduleRead) => {
    if (sch.frequency === 'weekly') {
      const day = WEEKDAYS.find(d => d.value === sch.execution_day);
      return `Cada semana (los ${day ? day.label.toLowerCase() : sch.execution_day})`;
    }
    return `Cada mes (el día ${sch.execution_day})`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5">
          Cuenta origen
        </label>
        <select
          required
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors text-graphite-blue outline-none appearance-none"
          disabled={isSubmitting}
        >
          <option value="" disabled>Selecciona una cuenta</option>
          {validAccounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.name} - {formatMoneyOrDash(acc.available_balance, acc.currency)} disp.
            </option>
          ))}
        </select>
        {validAccounts.length === 0 && (
          <p className="text-xs text-red-500 mt-1">No tienes cuentas disponibles en {goal.currency || 'COP'}.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5">
          Monto
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-blue/50 font-medium">$</span>
          <input
            type="number"
            required
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full pl-8 pr-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors placeholder:text-graphite-blue/30 outline-none"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5">
            Frecuencia
          </label>
          <select
            value={frequency}
            onChange={(e) => handleFrequencyChange(e.target.value as Frequency)}
            className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors text-graphite-blue outline-none appearance-none"
            disabled={isSubmitting}
          >
            <option value="weekly">Cada semana</option>
            <option value="monthly">Cada mes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-graphite-blue/70 mb-1.5">
            Día
          </label>
          {frequency === 'weekly' ? (
            <select
              required
              value={executionDay}
              onChange={(e) => setExecutionDay(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors text-graphite-blue outline-none appearance-none"
              disabled={isSubmitting}
            >
              {WEEKDAYS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          ) : (
            <select
              required
              value={executionDay}
              onChange={(e) => setExecutionDay(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-graphite-blue/5 border-transparent focus:border-graphite-blue focus:bg-white focus:ring-0 transition-colors text-graphite-blue outline-none appearance-none"
              disabled={isSubmitting}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d.toString()}>{d}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setError(null);
          }}
          className="flex-1 py-3 px-4 rounded-xl font-medium text-graphite-blue bg-graphite-blue/5 hover:bg-graphite-blue/10 transition-colors"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || validAccounts.length === 0}
          className="flex-1 py-3 px-4 rounded-xl font-medium bg-graphite-blue text-white hover:bg-graphite-blue/90 transition-colors disabled:opacity-50"
        >
          Guardar
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-blue/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-graphite-blue flex items-center gap-2">
            {isEditing && schedule && (
              <button onClick={() => setIsEditing(false)} className="text-graphite-blue/40 hover:text-graphite-blue transition-colors mr-1">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Settings className="w-5 h-5 text-sage-green" />
            {isEditing && schedule ? 'Editar configuración' : 'Aportes automáticos'}
          </h2>
          <button
            onClick={onClose}
            className="text-graphite-blue/40 hover:text-graphite-blue transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}
        
        {successMsg && !isEditing && (
          <div className="mb-4 p-4 rounded-xl bg-green-50 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
            <div className="text-sm text-green-700 font-medium">{successMsg}</div>
          </div>
        )}

        {isLoading ? (
          <div className="py-8 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-sage-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isEditing ? (
          renderForm()
        ) : schedule ? (
          <div className="space-y-4">
            <div className="bg-graphite-blue/5 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-graphite-blue/60 font-medium">Aporte configurado</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  schedule.status === 'active' ? 'bg-sage-green/10 text-sage-green' :
                  schedule.status === 'paused' ? 'bg-orange-100 text-orange-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {schedule.status === 'active' ? 'Activo' : 
                   schedule.status === 'paused' ? 'Pausado' : 
                   schedule.status === 'cancelled' ? 'Cancelado' : schedule.status}
                </span>
              </div>
              
              <div className="text-2xl font-semibold text-graphite-blue mb-1">
                {formatMoneyOrDash(schedule.amount, goal.currency || 'COP')}
              </div>
              <div className="text-sm text-graphite-blue/80">
                {formatFrequency(schedule)}
              </div>
              <div className="text-xs text-graphite-blue/50 mt-1">
                Desde {getAccountName(schedule.account_id)}
              </div>
            </div>

            {schedule.status === 'paused' && schedule.pause_reason && (
              <div className="bg-orange-50 rounded-xl p-3 text-sm text-orange-700 font-medium text-center">
                {goal.status === 'completed' && schedule.pause_reason === 'goal_completed' ? (
                  <>Aportes automáticos detenidos<br/><span className="text-xs opacity-80">Meta completada</span></>
                ) : (
                  getPauseReasonLabel(schedule.pause_reason)
                )}
              </div>
            )}

            <div className="bg-graphite-blue/5 rounded-2xl p-4">
              <div className="text-sm text-graphite-blue/60 font-medium mb-1">Próximo aporte</div>
              <div className="text-base font-medium text-graphite-blue">
                {formatDate(schedule.next_run_at)}
              </div>
            </div>

            {goal.status !== 'completed' && (
              <button 
                type="button"
                onClick={handleEditClick}
                className="w-full py-3 rounded-xl text-sm font-medium transition-colors bg-graphite-blue/5 text-graphite-blue hover:bg-graphite-blue/10 cursor-pointer mt-2"
              >
                Editar configuración
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-graphite-blue/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Settings className="w-6 h-6 text-graphite-blue/40" />
            </div>
            {goal.status === 'completed' ? (
              <>
                <p className="text-graphite-blue font-medium mb-2">Meta completada</p>
                <p className="text-sm text-graphite-blue/70 mb-6">Los aportes automáticos ya no están disponibles para esta meta.</p>
              </>
            ) : (
              <>
                <p className="text-graphite-blue font-medium mb-6">Aún no tienes aportes automáticos configurados.</p>
                <button 
                  type="button"
                  onClick={handleEditClick}
                  className="w-full py-3 rounded-xl text-sm font-medium transition-colors bg-sage-green text-white hover:bg-sage-green/90 cursor-pointer"
                >
                  Ahorrar automáticamente
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

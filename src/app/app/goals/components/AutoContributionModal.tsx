'use client';

import { useState, useEffect } from 'react';
import { components } from '@/lib/api/types.generated';
import { getGoalAutoContributionAction } from '../actions';
import { formatMoneyOrDash } from '@/lib/format/money';

const X = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const Settings = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const AlertCircle = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

type GoalAutoContributionScheduleRead = components['schemas']['GoalAutoContributionScheduleRead'];
type AccountRead = components['schemas']['AccountRead'];
type GoalRead = components['schemas']['GoalRead'];

interface Props {
  goal: GoalRead;
  accounts: AccountRead[];
  onClose: () => void;
}

export function AutoContributionModal({ goal, accounts, onClose }: Props) {
  const [schedule, setSchedule] = useState<GoalAutoContributionScheduleRead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getAccountName = (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
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

  const formatFrequency = (schedule: GoalAutoContributionScheduleRead) => {
    if (schedule.frequency === 'weekly') {
      const days: Record<string, string> = {
        monday: 'lunes',
        tuesday: 'martes',
        wednesday: 'miércoles',
        thursday: 'jueves',
        friday: 'viernes',
        saturday: 'sábado',
        sunday: 'domingo',
      };
      return `Cada semana (los ${days[schedule.execution_day] || schedule.execution_day})`;
    }
    return `Cada mes (el día ${schedule.execution_day})`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    // Use UTC date to avoid timezone shifts showing a wrong date if backend returns exactly midnight.
    // Backend next_run_at is an ISO string. We format it normally.
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-blue/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-graphite-blue flex items-center gap-2">
            <Settings className="w-5 h-5 text-sage-green" />
            Aportes automáticos
          </h2>
          <button
            onClick={onClose}
            className="text-graphite-blue/40 hover:text-graphite-blue transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          <div className="p-3 rounded-xl bg-red-50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="py-8 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-sage-green border-t-transparent rounded-full animate-spin"></div>
          </div>
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
                disabled
                className="w-full py-3 rounded-xl text-sm font-medium transition-colors bg-graphite-blue/5 text-graphite-blue/40 cursor-not-allowed mt-2"
              >
                Administrar (Próximamente)
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-graphite-blue/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Settings className="w-6 h-6 text-graphite-blue/40" />
            </div>
            <p className="text-graphite-blue font-medium">Aún no tienes aportes automáticos configurados.</p>
            
            {goal.status !== 'completed' && (
              <button 
                type="button"
                disabled
                className="w-full py-3 mt-6 rounded-xl text-sm font-medium transition-colors bg-graphite-blue/5 text-graphite-blue/40 cursor-not-allowed"
              >
                Configurar (Próximamente)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

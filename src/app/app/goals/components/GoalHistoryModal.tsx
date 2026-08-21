'use client';

import { useState, useEffect } from 'react';
import { components } from '@/lib/api/types.generated';
import { getGoalHistoryAction } from '../actions';
import { formatMoneyOrDash } from '@/lib/format/money';

const X = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const HistoryIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

type GoalTransactionRead = components['schemas']['GoalTransactionRead'];
type GoalRead = components['schemas']['GoalRead'];
type AccountRead = components['schemas']['AccountRead'];

interface Props {
  goal: GoalRead;
  accounts: AccountRead[];
  onClose: () => void;
}

export function GoalHistoryModal({ goal, accounts, onClose }: Props) {
  const [transactions, setTransactions] = useState<GoalTransactionRead[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchHistory() {
      setIsLoading(true);
      setError(null);
      const res = await getGoalHistoryAction(goal.id, 50);
      if (mounted) {
        if (res.success) {
          const result = res.result as components['schemas']['GoalTransactionsResponse'];
          setTransactions(result.items);
        } else {
          setError(res.error || 'No pudimos cargar el historial.');
        }
        setIsLoading(false);
      }
    }
    fetchHistory();
    return () => { mounted = false; };
  }, [goal.id]);

  const getAccountName = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.name : 'Cuenta';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
  };

  const renderTransactionType = (tx: GoalTransactionRead) => {
    if (tx.transaction_type === 'release') {
      return 'Liberación';
    }
    if (tx.transaction_type === 'allocation') {
      return tx.channel === 'automatic' ? 'Aporte automático' : 'Aporte';
    }
    if (tx.transaction_type === 'legacy_import') {
      return 'Aporte';
    }
    return 'Movimiento';
  };

  const getAmountClass = (tx: GoalTransactionRead) => {
    if (tx.transaction_type === 'release') return 'text-graphite-blue';
    return 'text-sage-green';
  };

  const getAmountPrefix = (tx: GoalTransactionRead) => {
    if (tx.transaction_type === 'release') return '-';
    return '+';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-blue/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-semibold text-graphite-blue flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-sage-green" />
            Historial de meta
          </h2>
          <button
            onClick={onClose}
            className="text-graphite-blue/40 hover:text-graphite-blue transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2">
          {error ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="w-6 h-6 border-2 border-sage-green border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center bg-graphite-blue/5 p-4 rounded-2xl">
                  <div>
                    <div className="text-sm font-medium text-graphite-blue flex items-center gap-2">
                      {renderTransactionType(tx)}
                      {tx.origin === 'legacy' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-graphite-blue/10 text-graphite-blue/60 px-1.5 py-0.5 rounded">Legacy</span>
                      )}
                    </div>
                    <div className="text-xs text-graphite-blue/50 mt-0.5 flex gap-1.5 items-center">
                      <span>{formatDate(tx.created_at)}</span>
                      <span className="w-1 h-1 rounded-full bg-graphite-blue/20"></span>
                      <span className="truncate max-w-[120px]">{getAccountName(tx.account_id)}</span>
                    </div>
                  </div>
                  <div className={`font-semibold text-right ${getAmountClass(tx)}`}>
                    {getAmountPrefix(tx)}{formatMoneyOrDash(tx.applied_amount, tx.goal_currency)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-graphite-blue/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <HistoryIcon className="w-6 h-6 text-graphite-blue/40" />
              </div>
              <p className="text-graphite-blue font-medium mb-2">Aún no hay movimientos en esta meta.</p>
              <p className="text-sm text-graphite-blue/60">Cuando aportes o liberes dinero, aparecerá aquí.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

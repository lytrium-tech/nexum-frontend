'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import { components } from '@/lib/api/types.generated';
import { 
  updateAccountAction, 
  archiveAccountAction, 
  restoreAccountAction, 
  adjustBalanceAction,
  getAccountScreenDataAction
} from '../actions';

type AccountDetailRead = components['schemas']['AccountDetailRead'];
type LedgerEventsResponse = components['schemas']['LedgerEventsResponse'];
type AccountPeriodSummary = components['schemas']['AccountPeriodSummary'];

const getAccountIcon = (type: string) => {
  switch (type) {
    case 'bank': return '🏦';
    case 'wallet': return '📱';
    case 'cash': return '💵';
    case 'savings': return '💰';
    default: return '💳';
  }
};

const getAccountTypeName = (type: string) => {
  switch (type) {
    case 'bank': return 'Cuenta Bancaria';
    case 'wallet': return 'Billetera Digital';
    case 'cash': return 'Efectivo';
    case 'savings': return 'Ahorros';
    default: return type;
  }
};

const formatBalance = (val: string | number | null | undefined, currency: string = 'COP') => {
  if (val === null || val === undefined || val === '—') return '—';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '—';
  
  if (currency === 'COP') {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const formatAbsoluteBalance = (val: string | number | null | undefined, currency: string = 'COP') => {
  if (val === null || val === undefined || val === '—') return '—';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '—';
  return formatBalance(Math.abs(num), currency);
};

type MovementPresentation = {
  semanticType: 'income' | 'expense' | 'transfer' | 'neutral';
  sign: string;
  textColor: string;
  formattedAmount: string;
  label: string;
};

function getMovementAmountPresentation(movement: components['schemas']['LedgerEventDetail']): MovementPresentation {
  const isTransfer = movement.event_type?.includes('transfer');
  const isInflow = movement.direction === 'inflow';
  
  let semanticType: 'income' | 'expense' | 'transfer' | 'neutral' = 'neutral';
  let sign = '';
  let textColor = 'text-gray-900';
  
  if (isTransfer) {
    semanticType = 'transfer';
    sign = isInflow ? '+' : '-';
    textColor = 'text-graphite-blue';
  } else {
    if (isInflow) {
      semanticType = 'income';
      sign = '+';
      textColor = 'text-green-600';
    } else {
      semanticType = 'expense';
      sign = '-';
      textColor = 'text-red-600';
    }
  }

  const baseLabel = isTransfer 
    ? (isInflow ? 'Transferencia recibida' : 'Transferencia enviada') 
    : (movement.description || 'Movimiento');

  const absoluteFormatted = formatAbsoluteBalance(movement.amount, movement.currency);
  
  return {
    semanticType,
    sign,
    textColor,
    formattedAmount: absoluteFormatted !== '—' ? `${sign}${absoluteFormatted}` : '—',
    label: baseLabel
  };
}

function createSafeUuid(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('').replace(
      /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
      '$1-$2-$3-$4-$5'
    );
  }

  throw new Error('Secure UUID generation is unavailable.');
}

export default function AccountDetailClient({
  initialAccount,
  initialMovements,
  initialSummary,
  initialMonth
}: { 
  initialAccount: AccountDetailRead;
  initialMovements: LedgerEventsResponse | null;
  initialSummary: AccountPeriodSummary | null;
  initialMonth: string;
}) {
  const [account, setAccount] = useState<AccountDetailRead>(initialAccount);
  
  const [movements, setMovements] = useState<LedgerEventsResponse | null>(initialMovements);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsError, setMovementsError] = useState(!initialMovements);
  
  const [month, setMonth] = useState(initialMonth);
  const [summary, setSummary] = useState<AccountPeriodSummary | null>(initialSummary);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(!initialSummary);
  
  // Modals state
  const [editModal, setEditModal] = useState<{ isOpen: boolean, name: string, type: string }>({ isOpen: false, name: '', type: 'bank' });
  const [adjustModal, setAdjustModal] = useState<{ isOpen: boolean, target_balance: string, reason: string, idempotency_key: string }>({ isOpen: false, target_balance: '', reason: '', idempotency_key: '' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const refreshAll = async (targetMonth: string) => {
    setMovementsLoading(true);
    setSummaryLoading(true);
    setMovementsError(false);
    setSummaryError(false);
    
    const result = await getAccountScreenDataAction(account.id, targetMonth);
    if (result.success && result.data) {
      setAccount(result.data.account);
      if (result.data.movements) {
        setMovements(result.data.movements);
      } else {
        setMovementsError(true);
      }
      if (result.data.summary) {
        setSummary(result.data.summary);
      } else {
        setSummaryError(true);
      }
    }
    
    setMovementsLoading(false);
    setSummaryLoading(false);
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    refreshAll(newMonth);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    
    if (editModal.name.trim() === account.name && editModal.type === account.type) {
      setEditModal({ ...editModal, isOpen: false });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await updateAccountAction(account.id, {
      name: editModal.name.trim(),
      type: editModal.type
    });

    setIsSubmitting(false);

    if (result.success) {
      setEditModal({ ...editModal, isOpen: false });
      refreshAll(month);
    } else {
      setError(result.error || 'Error al editar la cuenta.');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(adjustModal.target_balance);
    if (isNaN(numBalance) || numBalance < 0) {
      setError('Saldo inválido.');
      return;
    }
    if (!adjustModal.reason.trim()) {
      setError('Razón obligatoria.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await adjustBalanceAction(account.id, {
      target_balance: numBalance,
      reason: adjustModal.reason.trim(),
      idempotency_key: adjustModal.idempotency_key
    });

    setIsSubmitting(false);

    if (result.success) {
      setAdjustModal({ isOpen: false, target_balance: '', reason: '', idempotency_key: '' });
      refreshAll(month);
    } else {
      setError(result.error || 'Error al ajustar el saldo.');
    }
  };

  const openAdjustModal = () => {
    let key = '';
    let errorMessage = null;
    try {
      key = createSafeUuid();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      errorMessage = msg || 'No se puede generar un identificador seguro.';
    }

    setAdjustModal({
      isOpen: true,
      target_balance: account.balance || '0',
      reason: '',
      idempotency_key: key
    });
    setError(errorMessage);
  };

  const handleArchive = async () => {
    if (!confirm('¿Archivar cuenta?')) return;
    setIsProcessingAction(true);
    const result = await archiveAccountAction(account.id);
    setIsProcessingAction(false);
    if (result.success) {
      refreshAll(month);
    } else {
      setActionError(result.error || 'Error al archivar');
    }
  };

  const handleRestore = async () => {
    setIsProcessingAction(true);
    const result = await restoreAccountAction(account.id);
    setIsProcessingAction(false);
    if (result.success) {
      refreshAll(month);
    } else {
      setActionError(result.error || 'Error al restaurar');
    }
  };

  const isActive = account.is_active !== false && String(account.is_active) !== 'false';

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      
      {/* Header and Back navigation */}
      <div>
        <Link href="/app/accounts" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-graphite-blue mb-4 transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a Billeteras
        </Link>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl shadow-sm border border-gray-100">
              {getAccountIcon(account.type)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-graphite-blue leading-tight">{account.name}</h1>
                {!isActive && (
                  <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-md uppercase font-semibold">
                    Archivada
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{getAccountTypeName(account.type)}</p>
            </div>
          </div>
          
          <div className="flex flex-col md:items-end w-full md:w-auto">
            <p className="text-sm text-gray-500 mb-1">Saldo disponible</p>
            <p className={`text-4xl font-bold tracking-tight mb-4 ${account.balance?.startsWith('-') ? 'text-red-500' : 'text-graphite-blue'}`}>
              {formatBalance(account.balance || '0', account.currency)}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {isActive ? (
                <>
                  <button 
                    onClick={() => { setEditModal({ isOpen: true, name: account.name, type: account.type }); setError(null); }}
                    className="px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors border border-gray-200"
                    disabled={isProcessingAction}
                  >
                    Editar
                  </button>
                  <button 
                    onClick={openAdjustModal}
                    className="px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors border border-gray-200"
                    disabled={isProcessingAction}
                  >
                    Ajustar Saldo
                  </button>
                  <button 
                    onClick={handleArchive}
                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors border border-red-100"
                    disabled={isProcessingAction}
                  >
                    Archivar
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleRestore}
                  className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-medium transition-colors border border-green-200"
                  disabled={isProcessingAction}
                >
                  Restaurar Billetera
                </button>
              )}
            </div>
            {actionError && (
              <p className="text-red-500 text-xs mt-2">{actionError}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-lg font-semibold text-graphite-blue whitespace-nowrap">Resumen</h2>
              <MonthYearPicker 
                value={month}
                onChange={handleMonthChange}
              />
            </div>
            
            {summaryLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
              </div>
            ) : summaryError ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-3">No pudimos cargar el resumen operativo.</p>
                <button onClick={() => refreshAll(month)} className="text-sm text-graphite-blue font-medium hover:underline">Reintentar</button>
              </div>
            ) : summary ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ingresos operativos</span>
                  <span className="text-sm font-medium text-green-600">{formatBalance(summary.total_inflows, summary.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Egresos operativos</span>
                  <span className="text-sm font-medium text-red-600">{formatBalance(summary.total_outflows, summary.currency)}</span>
                </div>
                <div className="h-px bg-gray-100 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-graphite-blue">Flujo neto operativo</span>
                  <span className={`text-sm font-bold ${parseFloat(summary.net_flow || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatBalance(summary.net_flow, summary.currency)}
                  </span>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Transferencias</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Recibidas</span>
                    <span className="text-sm font-medium text-graphite-blue">{formatBalance(summary.transfer_inflows, summary.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Enviadas</span>
                    <span className="text-sm font-medium text-graphite-blue">{formatBalance(summary.transfer_outflows, summary.currency)}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Movements */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-graphite-blue">Movimientos</h2>
              {movementsError && !movementsLoading && (
                <button onClick={() => refreshAll(month)} className="text-sm text-graphite-blue font-medium hover:underline">Reintentar</button>
              )}
            </div>
            
            {movementsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-32"></div>
                      <div className="h-3 bg-gray-50 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : movementsError ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">No pudimos cargar los movimientos.</p>
                <button onClick={() => refreshAll(month)} className="text-sm text-graphite-blue font-medium hover:underline">Reintentar</button>
              </div>
            ) : movements?.items?.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="text-lg font-medium text-graphite-blue mb-1">Sin movimientos</h3>
                <p className="text-sm text-gray-500">No hay movimientos registrados en este periodo.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {movements?.items?.map(movement => {
                  const presentation = getMovementAmountPresentation(movement);
                  
                  return (
                    <div key={movement.id} className="flex justify-between items-center py-3 px-2 hover:bg-gray-50 rounded-xl transition-colors">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{presentation.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(movement.occurred_at || movement.created_at || '').toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${presentation.textColor}`}>
                          {presentation.formattedAmount}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* EDIT MODAL */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-soft-gray max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-medium text-graphite-blue mb-4">Editar cuenta</h2>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue outline-none"
                  value={editModal.name}
                  onChange={(e) => setEditModal({...editModal, name: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue outline-none bg-white"
                  value={editModal.type}
                  onChange={(e) => setEditModal({...editModal, type: e.target.value})}
                  disabled={isSubmitting}
                >
                  <option value="bank">Cuenta Bancaria</option>
                  <option value="wallet">Billetera Digital</option>
                  <option value="cash">Efectivo</option>
                  <option value="savings">Ahorros</option>
                </select>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2">
                <p className="text-xs text-gray-500">
                  La moneda y el saldo se administran mediante operaciones financieras y no pueden editarse aquí.
                </p>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button" 
                  onClick={() => { setEditModal({ isOpen: false, name: '', type: 'bank' }); setError(null); }}
                  className="px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-graphite-blue text-white px-6 py-2 rounded-xl hover:bg-graphite-blue/90 font-medium text-sm transition-colors min-w-[120px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST BALANCE MODAL */}
      {adjustModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-soft-gray max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-medium text-graphite-blue mb-2">Ajustar Saldo</h2>
            <p className="text-sm text-gray-500 mb-4">
              Nexum registrará un ajuste financiero para conciliar el saldo. No se modificará el historial existente.
            </p>
            <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-2 flex justify-between items-center">
                <span className="text-sm text-gray-600">Saldo actual registrado</span>
                <span className="font-semibold text-graphite-blue">{formatBalance(account.balance, account.currency)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo saldo real</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{account.currency}</span>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    className="w-full pl-14 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue outline-none"
                    placeholder="Ej. 50000"
                    value={adjustModal.target_balance}
                    onChange={(e) => setAdjustModal({...adjustModal, target_balance: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>
                {adjustModal.target_balance && !isNaN(parseFloat(adjustModal.target_balance)) && (
                  <p className="text-xs mt-2 text-gray-500">
                    Diferencia estimada: <span className="font-medium text-gray-700">{formatBalance(parseFloat(adjustModal.target_balance) - parseFloat(account.balance || '0'), account.currency)}</span>
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del ajuste</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue outline-none"
                  placeholder="Ej. Conciliación mensual"
                  value={adjustModal.reason}
                  onChange={(e) => setAdjustModal({...adjustModal, reason: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button" 
                  onClick={() => { setAdjustModal({ isOpen: false, target_balance: '', reason: '', idempotency_key: '' }); setError(null); }}
                  className="px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-graphite-blue text-white px-6 py-2 rounded-xl hover:bg-graphite-blue/90 font-medium text-sm transition-colors min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    isSubmitting || 
                    !adjustModal.target_balance.trim() || 
                    isNaN(parseFloat(adjustModal.target_balance)) || 
                    parseFloat(adjustModal.target_balance) < 0 || 
                    !adjustModal.reason.trim() ||
                    !adjustModal.idempotency_key ||
                    account.is_active === false ||
                    String(account.is_active) === 'false'
                  }
                >
                  {isSubmitting ? 'Ajustando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

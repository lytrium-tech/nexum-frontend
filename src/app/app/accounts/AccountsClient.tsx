'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createAccountAction, 
  updateAccountAction, 
  archiveAccountAction, 
  restoreAccountAction, 
  adjustBalanceAction 
} from './actions';
import Link from 'next/link';

import { components } from '@/lib/api/types.generated';

type AccountRead = components['schemas']['AccountRead'];

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

export default function AccountsClient({
  initialAccounts
}: {
  initialAccounts: AccountRead[];
}) {
  const router = useRouter();
  
  // Modals state
  const [isCreating, setIsCreating] = useState(false);
  const [createData, setCreateData] = useState({ name: '', type: 'bank', currency: 'COP', initial_balance: '' });
  
  const [editModal, setEditModal] = useState<{ isOpen: boolean, account: AccountRead | null, name: string, type: string }>({ isOpen: false, account: null, name: '', type: 'bank' });
  const [adjustModal, setAdjustModal] = useState<{ isOpen: boolean, account: AccountRead | null, target_balance: string, reason: string, idempotency_key: string }>({ isOpen: false, account: null, target_balance: '', reason: '', idempotency_key: '' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  
  // Context Menu state
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeAccounts = initialAccounts.filter(a => a.is_active !== false && String(a.is_active) !== 'false');
  const archivedAccounts = initialAccounts.filter(a => a.is_active === false || String(a.is_active) === 'false');
  const displayedAccounts = activeTab === 'active' ? activeAccounts : archivedAccounts;
  
  const totalBalance = '—'; // Calculo delegado al backend
  const baseCurrency = activeAccounts[0]?.currency || 'COP';

  const formatBalance = (val: string | number | null | undefined, currency: string = 'COP') => {
    if (val === null || val === undefined || val === '—') return '—';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '—';
    
    if (currency === 'COP') {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.name.trim()) {
      setError('El nombre de la cuenta es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createAccountAction({
      name: createData.name.trim(),
      type: createData.type,
      currency: createData.currency,
      initial_balance: createData.initial_balance.trim() === '' ? 0 : createData.initial_balance.trim()
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsCreating(false);
      setCreateData({ name: '', type: 'bank', currency: 'COP', initial_balance: '' });
    } else {
      setError(result.error || 'Error al crear la cuenta.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.account || !editModal.name.trim()) {
      setError('El nombre de la cuenta es obligatorio.');
      return;
    }
    
    // No submit if no changes
    if (editModal.name.trim() === editModal.account.name && editModal.type === editModal.account.type) {
      setEditModal({ ...editModal, isOpen: false });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await updateAccountAction(editModal.account.id, {
      name: editModal.name.trim(),
      type: editModal.type
    });

    setIsSubmitting(false);

    if (result.success) {
      setEditModal({ isOpen: false, account: null, name: '', type: 'bank' });
    } else {
      setError(result.error || 'Error al editar la cuenta.');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal.account) return;
    
    const numBalance = parseFloat(adjustModal.target_balance);
    if (isNaN(numBalance) || numBalance < 0) {
      setError('El saldo objetivo debe ser un número válido mayor o igual a 0.');
      return;
    }
    if (!adjustModal.reason.trim()) {
      setError('Debes proveer una razón para el ajuste.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await adjustBalanceAction(adjustModal.account.id, {
      target_balance: numBalance,
      reason: adjustModal.reason.trim(),
      idempotency_key: adjustModal.idempotency_key
    });

    setIsSubmitting(false);

    if (result.success) {
      setAdjustModal({ isOpen: false, account: null, target_balance: '', reason: '', idempotency_key: '' });
    } else {
      setError(result.error || 'Error al ajustar el saldo.');
    }
  };

  const openAdjustModal = (account: AccountRead) => {
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
      account,
      target_balance: account.balance || '0',
      reason: '',
      idempotency_key: key
    });
    setError(errorMessage);
  };

  const handleArchive = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas archivar esta cuenta? Dejará de aparecer en selectores, pero sus movimientos se conservarán.')) return;
    
    setIsProcessingId(id);
    setActionError(null);
    setMenuOpenId(null);
    
    const result = await archiveAccountAction(id);
    if (!result.success) {
      setActionError({ id, message: result.error || 'Error al archivar la cuenta.' });
    }
    setIsProcessingId(null);
  };

  const handleRestore = async (id: string) => {
    setIsProcessingId(id);
    setActionError(null);
    setMenuOpenId(null);
    
    const result = await restoreAccountAction(id);
    if (!result.success) {
      setActionError({ id, message: result.error || 'Error al restaurar la cuenta.' });
    }
    setIsProcessingId(null);
  };

  const openMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
        <div>
          <h1 className="text-2xl font-semibold text-graphite-blue">Billeteras</h1>
          <p className="text-sm text-gray-500">Gestiona tus cuentas y saldos disponibles.</p>
        </div>
        <button 
          onClick={() => { setIsCreating(true); setError(null); }}
          className="bg-graphite-blue text-white py-2 px-6 rounded-full hover:bg-graphite-blue/90 font-medium text-sm transition-colors"
        >
          Nueva cuenta
        </button>
      </div>

      {initialAccounts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from(new Set(activeAccounts.map(a => a.currency))).length > 1 ? (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray col-span-2 md:col-span-1">
              <p className="text-sm text-gray-500 mb-2">Saldos por moneda</p>
              <div className="space-y-1">
                {Object.entries(
                  activeAccounts.reduce((acc, account) => {
                    const val = parseFloat(account.balance || '0');
                    if (!acc[account.currency]) acc[account.currency] = 0;
                    if (!isNaN(val)) acc[account.currency] += val;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([curr, total]) => (
                  <div key={curr} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-600">{curr}</span>
                    <span className="font-semibold text-graphite-blue">{formatBalance(total, curr)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
              <p className="text-sm text-gray-500 mb-1">Balance Total</p>
              <p className="text-xl font-semibold text-graphite-blue">{formatBalance(totalBalance, baseCurrency)}</p>
            </div>
          )}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
            <p className="text-sm text-gray-500 mb-1">Cuentas Activas</p>
            <p className="text-xl font-semibold text-graphite-blue">{activeAccounts.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
            <p className="text-sm text-gray-500 mb-1">Cuentas Archivadas</p>
            <p className="text-xl font-semibold text-graphite-blue">{archivedAccounts.length}</p>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray animate-in fade-in zoom-in-95 duration-200 relative z-10">
          <h2 className="text-lg font-medium text-graphite-blue mb-4">Crear nueva cuenta</h2>
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue outline-none"
                  placeholder="Ej. Bancolombia, Billetera"
                  value={createData.name}
                  onChange={(e) => setCreateData({...createData, name: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue outline-none bg-white"
                  value={createData.type}
                  onChange={(e) => setCreateData({...createData, type: e.target.value})}
                  disabled={isSubmitting}
                >
                  <option value="bank">Cuenta Bancaria</option>
                  <option value="wallet">Billetera Digital</option>
                  <option value="cash">Efectivo</option>
                  <option value="savings">Ahorros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue outline-none bg-white"
                  value={createData.currency}
                  onChange={(e) => setCreateData({...createData, currency: e.target.value})}
                  disabled={isSubmitting}
                >
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="USD">USD - Dólar Estadounidense</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo inicial (opcional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue outline-none"
                    placeholder="Ej. 50000"
                    value={createData.initial_balance}
                    onChange={(e) => setCreateData({...createData, initial_balance: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Este saldo representa dinero que ya tienes. No contará como ingreso.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-2">
              <button 
                type="button" 
                onClick={() => { setIsCreating(false); setError(null); }}
                className="px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="bg-sage-green text-white px-6 py-2 rounded-xl hover:bg-sage-green/90 font-medium text-sm transition-colors flex items-center justify-center min-w-[120px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Crear Cuenta'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal.isOpen && editModal.account && (
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
                  onClick={() => { setEditModal({ isOpen: false, account: null, name: '', type: 'bank' }); setError(null); }}
                  className="px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-graphite-blue text-white px-6 py-2 rounded-xl hover:bg-graphite-blue/90 font-medium text-sm transition-colors flex items-center justify-center min-w-[120px]"
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
      {adjustModal.isOpen && adjustModal.account && (
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
                <span className="font-semibold text-graphite-blue">{formatBalance(adjustModal.account.balance, adjustModal.account.currency)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo saldo real</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{adjustModal.account.currency}</span>
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
                {/* Visual diff helper */}
                {adjustModal.target_balance && !isNaN(parseFloat(adjustModal.target_balance)) && (
                  <p className="text-xs mt-2 text-gray-500">
                    Diferencia estimada: <span className="font-medium text-gray-700">{formatBalance(parseFloat(adjustModal.target_balance) - parseFloat(adjustModal.account.balance || '0'), adjustModal.account.currency)}</span>
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
                  onClick={() => { setAdjustModal({ isOpen: false, account: null, target_balance: '', reason: '', idempotency_key: '' }); setError(null); }}
                  className="px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-graphite-blue text-white px-6 py-2 rounded-xl hover:bg-graphite-blue/90 font-medium text-sm transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    isSubmitting || 
                    !adjustModal.target_balance.trim() || 
                    isNaN(parseFloat(adjustModal.target_balance)) || 
                    parseFloat(adjustModal.target_balance) < 0 || 
                    !adjustModal.reason.trim() ||
                    !adjustModal.idempotency_key ||
                    adjustModal.account?.is_active === false ||
                    String(adjustModal.account?.is_active) === 'false'
                  }
                >
                  {isSubmitting ? 'Ajustando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {initialAccounts.length > 0 && (
        <div className="flex gap-2 border-b border-gray-200 px-2 pb-2">
          <button
            onClick={() => { setActiveTab('active'); setActionError(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'active' 
                ? 'bg-graphite-blue text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Activas ({activeAccounts.length})
          </button>
          <button
            onClick={() => { setActiveTab('archived'); setActionError(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'archived' 
                ? 'bg-graphite-blue text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Archivadas ({archivedAccounts.length})
          </button>
        </div>
      )}

      {displayedAccounts.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-soft-gray text-center mt-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            💳
          </div>
          <h2 className="text-xl font-medium text-graphite-blue mb-2">No hay cuentas {activeTab === 'archived' ? 'archivadas' : 'activas'}</h2>
          {activeTab === 'active' ? (
            <>
              <p className="text-gray-500 mb-6">
                {(archivedAccounts.length > 0)
                  ? 'No tienes billeteras activas. Crea una nueva o reactiva una billetera archivada.' 
                  : 'Agrega tu primera cuenta para empezar a registrar movimientos.'}
              </p>
              {!isCreating && (
                <button 
                  onClick={() => { setIsCreating(true); setError(null); }}
                  className="bg-graphite-blue text-white py-2 px-6 rounded-xl hover:bg-graphite-blue/90 font-medium transition-colors"
                >
                  {(archivedAccounts.length > 0) ? 'Crear nueva cuenta' : 'Crear mi primera cuenta'}
                </button>
              )}
            </>
          ) : (
            <p className="text-gray-500">Las cuentas archivadas se ocultan de tu balance principal pero conservan su historial.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {displayedAccounts.map(account => {
            const isMenuOpen = menuOpenId === account.id;
            return (
            <div key={account.id} className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray hover:shadow-md transition-all flex flex-col justify-between relative group cursor-pointer" onClick={() => router.push(`/app/accounts/${account.id}`)}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-lg shadow-sm border border-gray-100">
                    {getAccountIcon(account.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 leading-tight">{account.name}</h3>
                    <p className="text-xs text-gray-500">{getAccountTypeName(account.type)}</p>
                  </div>
                </div>
                
                {/* Status or Context Menu */}
                <div className="flex items-center relative" ref={isMenuOpen ? menuRef : null}>
                  {(account.is_active === false || String(account.is_active) === 'false') && (
                    <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-md uppercase font-semibold mr-2">
                      Archivada
                    </span>
                  )}
                  <button 
                    onClick={(e) => openMenu(e, account.id)}
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
                    aria-label="Opciones"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                      <Link 
                        href={`/app/accounts/${account.id}`}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver detalle
                      </Link>
                      
                      {activeTab === 'active' ? (
                        <>
                          <button 
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setEditModal({ isOpen: true, account, name: account.name, type: account.type }); setError(null); }}
                          >
                            Editar
                          </button>
                          <button 
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); openAdjustModal(account); }}
                          >
                            Ajustar saldo
                          </button>
                          <div className="h-px bg-gray-100 my-1 mx-2" />
                          <button 
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            onClick={(e) => { e.stopPropagation(); handleArchive(account.id); }}
                            disabled={isProcessingId === account.id}
                          >
                            Archivar
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="h-px bg-gray-100 my-1 mx-2" />
                          <button 
                            className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                            onClick={(e) => { e.stopPropagation(); handleRestore(account.id); }}
                            disabled={isProcessingId === account.id}
                          >
                            Restaurar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-2">
                <p className="text-xs text-gray-500 font-medium mb-1">Disponible</p>
                <p className={`text-2xl font-semibold tracking-tight ${account.available_balance?.startsWith('-') ? 'text-red-500' : 'text-graphite-blue'}`}>
                  {formatBalance(account.available_balance ?? account.balance, account.currency)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-gray-400 font-medium">Saldo bruto: {formatBalance(account.balance || '0', account.currency)}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">({account.currency})</p>
                </div>
              </div>

              {actionError?.id === account.id && (
                <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium" onClick={e => e.stopPropagation()}>
                  {actionError.message}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { createAccountAction, deleteAccountAction, updateAccountStatusAction } from './actions';

type AccountRead = {
  id: string;
  name: string;
  type: string;
  balance?: string | null;
  currency: string;
  is_active?: boolean | null;
};

type AccountSummary = {
  total_balance: string;
  accounts_count: number;
  active_accounts_count: number;
  currency: string;
};

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
  initialAccounts,
  initialSummary
}: {
  initialAccounts: AccountRead[];
  initialSummary: AccountSummary | null;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'bank', currency: 'COP', initial_balance: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  const activeAccounts = initialAccounts.filter(a => a.is_active !== false);
  const archivedAccounts = initialAccounts.filter(a => a.is_active === false);
  const displayedAccounts = activeTab === 'active' ? activeAccounts : archivedAccounts;

  const formatBalance = (val: string | number, currency: string = 'COP') => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '$0';
    
    if (currency === 'COP') {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('El nombre de la cuenta es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createAccountAction({
      name: formData.name.trim(),
      type: formData.type,
      currency: formData.currency,
      initial_balance: formData.initial_balance.trim() === '' ? 0 : formData.initial_balance.trim()
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsCreating(false);
      setFormData({ name: '', type: 'bank', currency: 'COP', initial_balance: '' });
    } else {
      setError(result.error || 'Error al crear la cuenta.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas intentar eliminar esta cuenta?')) return;
    setIsProcessingId(id);
    setActionError(null);
    const result = await deleteAccountAction(id);
    if (!result.success) {
      setActionError({ id, message: result.error || 'Error al eliminar la cuenta.' });
    }
    setIsProcessingId(null);
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    setIsProcessingId(id);
    setActionError(null);
    const result = await updateAccountStatusAction(id, newStatus);
    if (!result.success) {
      setActionError({ id, message: result.error || 'Error al actualizar la cuenta.' });
    }
    setIsProcessingId(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
        <div>
          <h1 className="text-2xl font-semibold text-graphite-blue">Billeteras</h1>
          <p className="text-sm text-gray-500">Gestiona tus cuentas y saldos disponibles.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-graphite-blue text-white py-2 px-6 rounded-full hover:bg-graphite-blue/90 font-medium text-sm transition-colors"
        >
          Nueva cuenta
        </button>
      </div>

      {initialSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
            <p className="text-sm text-gray-500 mb-1">Balance Total</p>
            <p className="text-xl font-semibold text-graphite-blue">{formatBalance(initialSummary.total_balance, initialSummary.currency)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
            <p className="text-sm text-gray-500 mb-1">Cuentas Activas</p>
            <p className="text-xl font-semibold text-graphite-blue">{initialSummary.active_accounts_count}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
            <p className="text-sm text-gray-500 mb-1">Cuentas Archivadas</p>
            <p className="text-xl font-semibold text-graphite-blue">{initialSummary.accounts_count - initialSummary.active_accounts_count}</p>
          </div>
        </div>
      )}

      {isCreating && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray animate-in fade-in zoom-in-95 duration-200">
          <h2 className="text-lg font-medium text-graphite-blue mb-4">Crear nueva cuenta</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue outline-none bg-white"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
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
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
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
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({...formData, initial_balance: e.target.value})}
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
                {(initialSummary && initialSummary.accounts_count > initialSummary.active_accounts_count)
                  ? 'No tienes billeteras activas. Crea una nueva o reactiva una billetera archivada.' 
                  : 'Agrega tu primera cuenta para empezar a registrar movimientos.'}
              </p>
              {!isCreating && (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-graphite-blue text-white py-2 px-6 rounded-xl hover:bg-graphite-blue/90 font-medium transition-colors"
                >
                  {(initialSummary && initialSummary.accounts_count > initialSummary.active_accounts_count) ? 'Crear nueva cuenta' : 'Crear mi primera cuenta'}
                </button>
              )}
            </>
          ) : (
            <p className="text-gray-500">Las cuentas archivadas se ocultan de tu balance principal pero conservan su historial.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {displayedAccounts.map(account => (
            <div key={account.id} className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray hover:shadow-md transition-shadow flex flex-col justify-between relative group">
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
                {!account.is_active && (
                  <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-md uppercase font-semibold">
                    Archivada
                  </span>
                )}
              </div>
              
              <div className="mb-4">
                <p className={`text-2xl font-semibold tracking-tight ${account.balance?.startsWith('-') ? 'text-red-500' : 'text-graphite-blue'}`}>
                  {formatBalance(account.balance || '0', account.currency)}
                </p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{account.currency}</p>
              </div>

              {actionError?.id === account.id && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                  {actionError.message}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex gap-2">
                {account.is_active !== false ? (
                  <>
                    <button
                      onClick={() => handleToggleStatus(account.id, false)}
                      disabled={isProcessingId === account.id}
                      className="flex-1 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                      title="Archivar oculta la billetera de tu vista principal sin borrar su historial."
                    >
                      Archivar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(account.id, true)}
                    disabled={isProcessingId === account.id}
                    className="flex-1 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Reactivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

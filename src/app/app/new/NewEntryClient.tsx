'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEntryAction } from './actions';

type AccountRead = {
  id: string;
  name: string;
  type: string;
  currency: string;
  is_active?: boolean | null;
};

type CategoryRead = {
  id: string;
  name: string;
  type?: string | null;
  is_active?: boolean | null;
};

export default function NewEntryClient({
  initialAccounts,
  initialCategories
}: {
  initialAccounts: AccountRead[];
  initialCategories: CategoryRead[];
}) {
  const router = useRouter();
  
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>(initialAccounts.length > 0 ? initialAccounts[0].id : '');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const activeAccounts = initialAccounts.filter(a => a.is_active !== false && String(a.is_active) !== 'false');
  const filteredCategories = initialCategories.filter(c => c.is_active !== false && (c.type === type || c.type === 'transfer'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSuccess(false);

    if (activeAccounts.length === 0) {
      setError('Debes tener al menos una cuenta activa para registrar movimientos.');
      return;
    }
    
    if (!accountId) {
      setError('Selecciona una cuenta.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('El monto debe ser un número mayor a cero.');
      return;
    }

    setIsSubmitting(true);

    const selectedAccount = activeAccounts.find(a => a.id === accountId);
    if (!selectedAccount || !selectedAccount.currency) {
      setError('No pudimos identificar la moneda de esta cuenta. Intenta seleccionarla nuevamente.');
      return;
    }
    const currency = selectedAccount.currency;

    const result = await createEntryAction({
      type,
      accountId,
      amount: numAmount,
      currency,
      categoryId: categoryId || undefined,
      description: description.trim() || undefined
    });

    setIsSubmitting(false);

    if (result.success) {
      setShowSuccess(true);
      setAmount('');
      setDescription('');
    } else {
      setError(result.error || 'Error al registrar el movimiento.');
    }
  };

  if (activeAccounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
        <h3 className="text-lg font-medium text-slate-800 mb-2">No tienes cuentas disponibles</h3>
        <p className="text-slate-500 mb-6">Para registrar un movimiento primero debes crear una cuenta o billetera.</p>
        <button
          onClick={() => router.push('/app/accounts')}
          className="bg-slate-800 text-white px-6 py-2 rounded-xl font-medium hover:bg-slate-700 transition-colors"
        >
          Ir a Billeteras
        </button>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-slate-800 mb-2">¡Movimiento registrado!</h3>
        <p className="text-slate-500 mb-8">El {type === 'income' ? 'ingreso' : 'gasto'} ha sido guardado exitosamente.</p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push('/app/history')}
            className="px-6 py-2.5 rounded-xl font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Ver historial
          </button>
          <button
            onClick={() => setShowSuccess(false)}
            className="px-6 py-2.5 rounded-xl font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            Registrar otro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm">
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => { setType('expense'); setCategoryId(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            type === 'expense' 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => { setType('income'); setCategoryId(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            type === 'income' 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Ingreso
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Monto *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cuenta *</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all appearance-none"
          >
            {activeAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency})
              </option>
            ))}
          </select>
        </div>

        {initialCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all appearance-none"
            >
              <option value="">-- Sin categoría --</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
            placeholder="Ej. Supermercado, Salario, etc."
            maxLength={255}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-xl font-medium text-white transition-all ${
            isSubmitting 
              ? 'bg-slate-400 cursor-not-allowed' 
              : type === 'income'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-slate-800 hover:bg-slate-900'
          }`}
        >
          {isSubmitting ? 'Registrando...' : `Registrar ${type === 'income' ? 'Ingreso' : 'Gasto'}`}
        </button>
      </form>
    </div>
  );
}

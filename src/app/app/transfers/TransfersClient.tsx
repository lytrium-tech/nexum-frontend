'use client';

import React, { useState } from 'react';
import { components } from '@/lib/api/types.generated';
import { createTransferAction } from './actions';
import { formatMoneyOrDash } from '@/lib/format/money';

type TransferResult = components['schemas']['TransferResult'];
type AccountRead = components['schemas']['AccountRead'];

interface TransfersClientProps {
  initialTransfers: TransferResult[];
  accounts: AccountRead[];
}

export default function TransfersClient({ initialTransfers, accounts }: TransfersClientProps) {
  const [transfers] = useState<TransferResult[]>(initialTransfers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = accounts.filter(a => a.is_active);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const sourceAccountId = formData.get('source_account_id') as string;
    const destinationAccountId = formData.get('destination_account_id') as string;
    const amountStr = formData.get('amount') as string;
    const description = formData.get('description') as string;

    const amount = parseFloat(amountStr);

    if (!sourceAccountId || !destinationAccountId) {
      setError('Debes seleccionar cuenta de origen y destino.');
      setIsSubmitting(false);
      return;
    }

    if (sourceAccountId === destinationAccountId) {
      setError('La cuenta de origen y destino no pueden ser la misma.');
      setIsSubmitting(false);
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser mayor a $0.');
      setIsSubmitting(false);
      return;
    }

    const sourceAccount = activeAccounts.find(a => a.id === sourceAccountId);
    const currency = sourceAccount?.currency || 'COP';

    const payload: components['schemas']['TransferCreate'] = {
      source_account_id: sourceAccountId,
      destination_account_id: destinationAccountId,
      amount: amount.toString(),
      currency: currency,
      description: description.trim() || null,
      occurred_at: new Date().toISOString(),
      command_id: null,
      source_message_id: null,
      raw_message: null
    };

    const idempotencyKey = crypto.randomUUID();
    const res = await createTransferAction(payload, idempotencyKey);

    if (res.success) {
      setIsCreateModalOpen(false);
    } else {
      setError(res.error || 'Ocurrió un error inesperado al registrar la transferencia.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
        <div>
          <h1 className="text-2xl font-semibold text-graphite-blue">Transferencias</h1>
          <p className="text-sm text-gray-500">Mueve dinero entre tus cuentas sin alterar tus ingresos ni gastos.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-graphite-blue text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-graphite-blue/90 transition-colors shadow-sm"
        >
          Nueva transferencia
        </button>
      </div>

      {transfers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-soft-gray text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-graphite-blue mb-2">No hay transferencias</h2>
          <p className="text-gray-500 mb-6">Aún no has realizado transferencias entre tus cuentas.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-graphite-blue text-white py-2 px-6 rounded-xl hover:bg-graphite-blue/90 transition-colors font-medium"
          >
            Registrar Transferencia
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-soft-gray overflow-hidden">
          <div className="divide-y divide-soft-gray">
            {transfers.map((t) => (
              <div key={t.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-graphite-blue flex items-center gap-2">
                      {t.source_account?.name || 'Cuenta Origen'} 
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg> 
                      {t.destination_account?.name || 'Cuenta Destino'}
                    </p>
                    {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.created_at)}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  {t.target_currency && t.currency !== t.target_currency ? (
                    <>
                      <p className="text-xs text-gray-500 font-medium">
                        Transferiste {formatMoneyOrDash(t.amount, t.currency)}
                      </p>
                      <p className="text-base font-semibold text-graphite-blue mt-0.5">
                        {t.is_estimated ? '≈ ' : ''}{formatMoneyOrDash(t.target_amount, t.target_currency)} <span className="text-[10px] text-gray-400 uppercase font-normal">recibidos</span>
                      </p>
                      {t.fx_rate && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          Tasa usada: 1 {t.currency} = {formatMoneyOrDash(t.fx_rate, t.target_currency)}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-graphite-blue">
                        {formatMoneyOrDash(t.amount, t.currency)}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase">{t.currency || 'COP'}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-blue/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-soft-gray">
            <div className="p-6 border-b border-soft-gray flex justify-between items-center">
              <h3 className="text-xl font-semibold text-graphite-blue">Nueva Transferencia</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Origen</label>
                  <select 
                    name="source_account_id" 
                    required 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue focus:border-transparent outline-none bg-white text-sm"
                  >
                    <option value="">Selecciona cuenta origen...</option>
                    {activeAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({formatMoneyOrDash(a.balance, a.currency)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Destino</label>
                  <select 
                    name="destination_account_id" 
                    required 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue focus:border-transparent outline-none bg-white text-sm"
                  >
                    <option value="">Selecciona cuenta destino...</option>
                    {activeAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({formatMoneyOrDash(a.balance, a.currency)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto a transferir</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input 
                      type="number" 
                      name="amount" 
                      required 
                      min="1"
                      step="any"
                      placeholder="0.00"
                      className="w-full pl-8 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-gray-400 font-normal">(Opcional)</span></label>
                  <input 
                    type="text" 
                    name="description" 
                    placeholder="Ej: Ahorro mensual"
                    maxLength={255}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || activeAccounts.length < 2}
                  className="flex-1 px-4 py-3 bg-graphite-blue text-white rounded-xl font-medium hover:bg-graphite-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {isSubmitting ? 'Transfiriendo...' : 'Transferir'}
                </button>
              </div>
              {activeAccounts.length < 2 && (
                <p className="text-xs text-red-500 mt-3 text-center">
                  Necesitas al menos 2 cuentas activas para transferir.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

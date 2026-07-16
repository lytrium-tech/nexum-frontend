'use client';

import React, { useState } from 'react';
import { components } from '@/lib/api/types.generated';
import { reclassifyEventAction } from './actions';

type LedgerEventDetail = components['schemas']['LedgerEventDetail'];
type CategoryRead = components['schemas']['CategoryRead'];

export default function ReclassifyButton({
  event,
  categories
}: {
  event: LedgerEventDetail;
  categories: CategoryRead[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [reason, setReason] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categories allowed for this event
  const eligibleCategories = categories.filter(c => 
    c.is_active !== false && 
    c.type === event.event_type &&
    c.id !== event.category?.id
  );

  const handleOpen = () => {
    setIsOpen(true);
    setNewCategoryId('');
    setReason('');
    setError(null);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      setIdempotencyKey(window.crypto.randomUUID());
    } else {
      setIdempotencyKey(Math.random().toString(36).substring(2) + Date.now().toString(36));
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (!newCategoryId) {
      setError('Debes seleccionar una categoría.');
      return;
    }
    if (newCategoryId === event.category?.id) {
      setError('Debes seleccionar una categoría diferente.');
      return;
    }
    if (reason.length > 500) {
      setError('El motivo no puede exceder 500 caracteres.');
      return;
    }

    setIsSubmitting(true);
    
    const result = await reclassifyEventAction(event.id, {
      new_category_id: newCategoryId,
      reason: reason.trim() || undefined,
      idempotency_key: idempotencyKey
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsOpen(false);
    } else {
      setError(result.error || 'Error desconocido.');
    }
  };

  return (
    <>
      <button 
        onClick={handleOpen}
        className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors underline decoration-slate-300 hover:decoration-slate-500 underline-offset-2 mt-1 inline-block"
      >
        Cambiar categoría
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-left">
              <h2 className="text-xl font-medium text-slate-800 mb-2">Reclasificar Movimiento</h2>
              <p className="text-sm text-slate-500 mb-6">
                Cambia la categoría de este movimiento. Categoría actual: <span className="font-medium text-slate-700">{event.category?.name || 'Sin categoría'}</span>
              </p>

              {eligibleCategories.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4">
                  No hay otras categorías disponibles para este tipo de movimiento.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Categoría</label>
                    <select
                      value={newCategoryId}
                      onChange={(e) => setNewCategoryId(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 appearance-none"
                    >
                      <option value="">-- Selecciona una categoría --</option>
                      {eligibleCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700">Motivo (Opcional)</label>
                      <span className={`text-xs ${reason.length > 500 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                        {reason.length}/500
                      </span>
                    </div>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      disabled={isSubmitting}
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 resize-none"
                      placeholder="Ej. Reclasificación por ajuste mensual"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newCategoryId || reason.length > 500}
                      className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Guardando...' : 'Reclasificar'}
                    </button>
                  </div>
                </form>
              )}
              {eligibleCategories.length === 0 && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

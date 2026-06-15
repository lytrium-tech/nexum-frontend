'use client';

import React, { useState } from 'react';
import { components } from '@/lib/api/types.generated';
import { createCategoryAction, updateCategoryAction } from './actions';

type CategoryRead = components['schemas']['CategoryRead'];

const TYPE_LABELS: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
  credit_card: 'Tarjeta',
  obligation: 'Obligación',
  goal: 'Meta',
  system: 'Sistema'
};

export default function CategoriesClient({ initialCategories }: { initialCategories: CategoryRead[] }) {
  const [categories, setCategories] = useState<CategoryRead[]>(initialCategories);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const globalCategories = categories.filter(c => c.is_global);
  const customCategories = categories.filter(c => !c.is_global);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre es requerido.');
      return;
    }

    const lowerName = name.trim().toLowerCase();
    const existing = categories.find(c => c.type === type && c.name.toLowerCase() === lowerName);
    if (existing) {
      if (existing.is_active === false) {
        setError('Ya existe una categoría inactiva con este nombre. Reactívala en lugar de crear otra.');
      } else {
        setError('Ya existe una categoría con este nombre.');
      }
      return;
    }

    setIsSubmitting(true);
    const result = await createCategoryAction({ name: name.trim(), type });
    setIsSubmitting(false);

    if (result.success && result.result) {
      setCategories([...categories, result.result]);
      setIsCreating(false);
      setName('');
      setType('expense');
    } else {
      setError(result.error || 'Error al crear la categoría.');
    }
  };

  const handleUpdate = async (id: string) => {
    setError(null);
    if (!editName.trim()) {
      setError('El nombre es requerido.');
      return;
    }

    setIsSubmitting(true);
    console.log('[DEBUG category update] category_id', id);
    const payload = { name: editName.trim(), is_active: editActive };
    console.log('[DEBUG category update] payload enviado', payload);
    const result = await updateCategoryAction(id, payload);
    console.log('[DEBUG category update] status/error recibido', result);
    setIsSubmitting(false);

    if (result.success && result.result) {
      setCategories(categories.map(c => c.id === id ? result.result! : c));
      setEditingId(null);
    } else {
      let errMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
      if (!errMsg || errMsg === '{}' || errMsg === 'Ocurrió un error al actualizar la categoría. Intenta nuevamente.') {
        errMsg = 'No se pudo guardar la categoría. Intenta nuevamente.';
      }
      setError(errMsg);
    }
  };

  const startEdit = (cat: CategoryRead) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditActive(cat.is_active !== false); // default true if undefined
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Create Section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-slate-800">Tus categorías personalizadas</h2>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="text-sm font-medium bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              + Nueva categoría
            </button>
          )}
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Nombre</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                  placeholder="Ej. Comida rápida"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Tipo</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as 'expense' | 'income')}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 appearance-none"
                  disabled={isSubmitting}
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
            </div>
            
            {error && isCreating && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsCreating(false); setError(null); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Crear'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {customCategories.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No has creado ninguna categoría personalizada aún.</p>
          ) : (
            customCategories.map(cat => (
              <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors gap-3">
                {editingId === cat.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                      disabled={isSubmitting}
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={e => setEditActive(e.target.checked)}
                        disabled={isSubmitting}
                        className="rounded text-slate-800 focus:ring-slate-800"
                      />
                      Activa
                    </label>
                    <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleUpdate(cat.id)}
                        disabled={isSubmitting}
                        className="text-xs font-medium bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={isSubmitting}
                        className="text-xs font-medium text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${cat.is_active !== false ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${cat.is_active !== false ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{cat.name}</p>
                        {cat.is_active === false && (
                          <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-semibold">Inactiva</span>
                        )}
                        <p className="text-xs text-slate-400 capitalize hidden sm:block">{cat.type ? TYPE_LABELS[cat.type] || cat.type : 'General'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cat.is_active === false && (
                        <button
                          onClick={async () => {
                            setIsSubmitting(true);
                            console.log('[DEBUG category update] category_id', cat.id);
                            const payload = { is_active: true };
                            console.log('[DEBUG category update] payload enviado', payload);
                            const result = await updateCategoryAction(cat.id, payload);
                            console.log('[DEBUG category update] status/error recibido', result);
                            setIsSubmitting(false);
                            if (result.success && result.result) {
                              setCategories(categories.map(c => c.id === cat.id ? result.result! : c));
                            } else {
                              setError(typeof result.error === 'string' ? result.error : JSON.stringify(result.error) || 'Error al reactivar la categoría.');
                            }
                          }}
                          disabled={isSubmitting}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          Reactivar
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(cat)}
                        className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Editar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          {error && editingId && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Global Section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-800 mb-6">Categorías del Sistema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {globalCategories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <div>
                <p className="font-medium text-slate-700 text-sm">
                  {cat.name === 'sin_clasificar' ? 'Sin clasificar' : cat.name}
                </p>
                <p className="text-xs text-slate-400">
                  {cat.name === 'sin_clasificar' ? 'Categoría de respaldo del sistema' : (cat.type ? TYPE_LABELS[cat.type] || cat.type : 'General')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

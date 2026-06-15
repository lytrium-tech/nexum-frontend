import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import CategoriesClient from './CategoriesClient';
import { components } from '@/lib/api/types.generated';

export const metadata = {
  title: 'Categorías - Nexum',
};

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const token = await getSessionToken(true);
  
  if (!token) {
    redirect('/login');
  }

  let categories: components['schemas']['CategoryRead'][] = [];
  let hasError = false;

  try {
    categories = await api.categories.list(true);
  } catch (error) {
    console.error('Error fetching categories:', error);
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-medium text-slate-800 mb-2">Error de conexión</h2>
        <p className="text-slate-500 mb-6 max-w-md">
          No pudimos cargar tus categorías. Por favor, verifica tu conexión e intenta nuevamente.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full pb-20">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Categorías</h1>
        <p className="text-sm text-slate-500 mt-1">Organiza cómo Nexum clasifica tus movimientos.</p>
      </header>

      <CategoriesClient initialCategories={categories} />
    </div>
  );
}

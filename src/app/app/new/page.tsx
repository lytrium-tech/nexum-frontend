import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import NewEntryClient from './NewEntryClient';
import { components } from '@/lib/api/types.generated';

export const metadata = {
  title: 'Nuevo Movimiento - Nexum',
};

export const dynamic = 'force-dynamic';

export default async function NewEntryPage() {
  const token = await getSessionToken(true);
  
  if (!token) {
    redirect('/login');
  }

  let accounts: components['schemas']['AccountRead'][] = [];
  let categories: components['schemas']['CategoryRead'][] = [];
  let hasError = false;

  try {
    // We can fetch both accounts and categories in parallel
    const [accountsData, categoriesData] = await Promise.all([
      api.accounts.list(true),
      api.categories.list(undefined, true)
    ]);
    accounts = accountsData;
    categories = categoriesData;
  } catch (error) {
    console.error('Error fetching data for new entry:', error);
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
          No pudimos cargar tu información financiera. Por favor, verifica tu conexión e intenta nuevamente.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full pb-20">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Nuevo movimiento</h1>
        <p className="text-sm text-slate-500 mt-1">Registra un ingreso o gasto de forma manual.</p>
      </header>

      <NewEntryClient initialAccounts={accounts} initialCategories={categories} />
    </div>
  );
}

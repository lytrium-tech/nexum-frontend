import { Metadata } from 'next';
import { api } from '@/lib/api/endpoints';
import { getSessionToken } from '@/lib/api/client';
import { redirect } from 'next/navigation';
import GoalsClient from './GoalsClient';

export const metadata: Metadata = {
  title: 'Metas | Nexum',
  description: 'Convierte tu dinero en objetivos claros.',
};

export default async function GoalsPage() {
  const token = await getSessionToken(true);

  if (!token) {
    redirect('/login');
  }

  let goals = [];
  let accounts = [];
  try {
    const goalsPromise = api.goals.list(true);
    const accountsPromise = api.accounts.list(true);
    
    const results = await Promise.all([goalsPromise, accountsPromise]);
    goals = results[0];
    accounts = results[1];
  } catch (error: unknown) {
    console.error('Failed to load goals or accounts data:', error);
    const status = (error as { status?: number }).status;
    if (status === 401 || status === 403) {
      redirect('/login');
    }
    
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-4 text-center">
        <div className="rounded-2xl bg-red-50 p-6">
          <p className="text-red-600 font-medium mb-2">No pudimos cargar tus metas</p>
          <p className="text-sm text-red-500 max-w-sm mx-auto">
            Hubo un error de conexión con el servidor. Por favor, intenta recargar la página en unos instantes.
          </p>
        </div>
      </div>
    );
  }

  return <GoalsClient initialGoals={goals} accounts={accounts} />;
}

import { Metadata } from 'next';
import { api } from '@/lib/api/endpoints';
import { getSessionToken } from '@/lib/api/client';
import { redirect } from 'next/navigation';
import ObligationsClient from './ObligationsClient';
import ObligationsV17Client from './ObligationsV17Client';
import { components } from '@/lib/api/types.generated';
import { isObligationsV17Enabled } from '@/lib/features';

export const metadata: Metadata = {
  title: 'Obligaciones | Nexum',
  description: 'Controla tus compromisos y pagos pendientes.',
};

export default async function ObligationsPage() {
  const token = await getSessionToken(true);

  if (!token) {
    redirect('/login');
  }

  let obligations: components['schemas']['ObligationRead'][] = [];
  let accounts: components['schemas']['AccountRead'][] = [];
  
  if (isObligationsV17Enabled()) {
    try {
      accounts = await api.accounts.list(true, { include_archived: true });
    } catch (error: unknown) {
      console.error('Failed to load accounts for V1.7:', error);
      const status = (error as { status?: number }).status;
      if (status === 401 || status === 403) redirect('/login');
    }
    return <ObligationsV17Client accounts={accounts} />;
  }


  try {
    const obligationsPromise = api.obligations.list(true, { include_archived: true });
    const accountsPromise = api.accounts.list(true, { include_archived: true });
    
    const results = await Promise.all([obligationsPromise, accountsPromise]);
    obligations = results[0];
    accounts = results[1];
  } catch (error: unknown) {
    console.error('Failed to load obligations or accounts data:', error);
    const status = (error as { status?: number }).status;
    if (status === 401 || status === 403) {
      redirect('/login');
    }
    
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-4 text-center">
        <div className="rounded-2xl bg-red-50 p-6">
          <p className="text-red-600 font-medium mb-2">No pudimos cargar tus obligaciones</p>
          <p className="text-sm text-red-500 max-w-sm mx-auto">
            Hubo un error de conexión con el servidor. Por favor, intenta recargar la página en unos instantes.
          </p>
        </div>
      </div>
    );
  }

  return <ObligationsClient initialObligations={obligations} accounts={accounts} />;
}

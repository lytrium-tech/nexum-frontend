import { Metadata } from 'next';
import { api } from '@/lib/api/endpoints';
import { getSessionToken } from '@/lib/api/client';
import { redirect } from 'next/navigation';
import ObligationsV17Client from './ObligationsV17Client';
import { components } from '@/lib/api/types.generated';

export const metadata: Metadata = {
  title: 'Obligaciones | Nexum',
  description: 'Controla tus compromisos y pagos pendientes.',
};

export default async function ObligationsPage() {
  const token = await getSessionToken(true);

  if (!token) {
    redirect('/login');
  }

  let accounts: components['schemas']['AccountRead'][] = [];
  
  try {
    accounts = await api.accounts.list(true, { include_archived: true });
  } catch (error: unknown) {
    console.error('Failed to load accounts for obligations:', error);
    const status = (error as { status?: number }).status;
    if (status === 401 || status === 403) redirect('/login');
    
    // We can still render the client, it will handle data fetching errors internally if needed
  }
  return <ObligationsV17Client accounts={accounts} />;
}

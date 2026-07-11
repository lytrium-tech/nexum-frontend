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
  let overview: components['schemas']['ObligationV17OverviewResponse'][] = [];
  let summary: components['schemas']['ObligationsV17SummaryResponse'] | null = null;
  
  try {
    const [accountsRes, overviewRes, summaryRes] = await Promise.all([
      api.accounts.list(true, { include_archived: true }),
      api.obligationsV17.overview(true),
      api.obligationsV17.summary(undefined, true),
    ]);
    accounts = accountsRes;
    overview = overviewRes;
    summary = summaryRes;
  } catch (error: unknown) {
    console.error('Failed to load initial data for obligations:', error);
    const status = (error as { status?: number }).status;
    if (status === 401 || status === 403) redirect('/login');
    
    // We can still render the client, it will handle data fetching errors internally if needed
  }
  return <ObligationsV17Client accounts={accounts} initialObligations={overview} initialSummary={summary} />;
}

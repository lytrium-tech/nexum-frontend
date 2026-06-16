import { getSessionToken } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import { redirect } from 'next/navigation';
import CreditClient from './CreditClient';

import { components } from '@/lib/api/types.generated';

export const metadata = {
  title: 'Tarjetas de crédito - Nexum',
};

type CreditCardRead = components['schemas']['CreditCardRead'];
type AccountRead = components['schemas']['AccountRead'];

export default async function CreditPage() {
  const token = await getSessionToken(true);
  
  if (!token) {
    redirect('/login');
  }

  let creditCards: CreditCardRead[] = [];
  let accounts: AccountRead[] = [];
  let error: string | null = null;

  try {
    const [fetchedCards, fetchedAccounts] = await Promise.all([
      api.credit.cards.list(true),
      api.accounts.list(true)
    ]);
    creditCards = fetchedCards || [];
    accounts = fetchedAccounts || [];
  } catch (err: unknown) {
    console.error('Error fetching credit data:', err);
    error = 'No pudimos cargar tus tarjetas de crédito. Por favor, intenta de nuevo más tarde.';
  }

  return <CreditClient initialCards={creditCards} initialAccounts={accounts} initialError={error} />;
}

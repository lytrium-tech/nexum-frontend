import { redirect } from 'next/navigation';
import { api } from '@/lib/api/endpoints';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // 1. Try to get the user
    let userExists = true;
    try {
      await api.users.me(true);
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status === 404 || err.status === 401) {
        userExists = false;
      } else {
        throw error;
      }
    }

    // 2. If user doesn't exist, bootstrap
    if (!userExists) {
      await api.users.bootstrap({
        timezone: 'America/Bogota',
        currency: 'COP',
      }, true);
    }

    // 3. Get accounts
    const accounts = await api.accounts.list(true);

    // 4. Redirect to onboarding if no accounts
    if (accounts.length === 0) {
      redirect('/onboarding/wallet');
    }

  } catch (error) {
    console.error('Error in AppLayout bootstrap:', error);
    // If it's an API error and it's 401, they probably have an expired session
    // Redirecting to login might be best
    redirect('/login');
  }

  return <>{children}</>;
}

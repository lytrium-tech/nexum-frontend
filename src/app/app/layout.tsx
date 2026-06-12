import { redirect } from 'next/navigation';
import { api } from '@/lib/api/endpoints';
import { getSessionToken } from '@/lib/api/client';
import AppShell from '@/components/layout/AppShell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Validate Supabase session
  const token = await getSessionToken(true);
  if (!token) {
    redirect('/login');
  }

  let accounts: unknown[] = [];
  let categories: unknown[] = [];
  let sessionExpired = false;

  try {
    // 2. Execute idempotent bootstrap
    try {
      await api.users.bootstrap({
        timezone: 'America/Bogota',
        currency: 'COP',
      }, true);
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status === 401 || err.status === 403) {
        throw error; // Let the outer catch handle it
      }
      console.warn('Bootstrap returned an error, but it might be safe to continue:', err);
    }

    // 3. Get user details
    await api.users.me(true);

    // 4. Get accounts and categories concurrently
    [accounts, categories] = await Promise.all([
      api.accounts.list(true),
      api.categories.list(true)
    ]);

  } catch (error: unknown) {
    console.error('Error in AppLayout fetch:', error);
    const err = error as { status?: number };
    
    if (err.status === 401) {
      sessionExpired = true;
    } else if (err.status === 403) {
      throw new Error('Acceso denegado. No tienes permisos para ver esta información.');
    } else {
      throw error; // Next.js Error Boundary
    }
  }

  // Handle redirects outside try/catch
  if (sessionExpired) {
    redirect('/login');
  }

  if (accounts.length === 0) {
    redirect('/onboarding/wallet');
  }

  if (categories.length === 0) {
    redirect('/onboarding/categories');
  }

  return <AppShell>{children}</AppShell>;
}

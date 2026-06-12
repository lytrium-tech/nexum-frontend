import { redirect } from 'next/navigation';
import { api } from '@/lib/api/endpoints';
import { getSessionToken } from '@/lib/api/client';

import AppShell from '@/components/layout/AppShell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // 1. Validate Supabase session
    const token = await getSessionToken(true);
    if (!token) {
      redirect('/login');
    }

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
      // If 500 or others, we might log it and continue if users.me works
      console.warn('Bootstrap returned an error, but it might be safe to continue if user exists:', err);
    }

    // 3. Get user details
    await api.users.me(true);

    // 4. Get accounts
    const accounts = await api.accounts.list(true);

    // 5. Check first account existence
    if (accounts.length === 0) {
      redirect('/onboarding/wallet');
    }

    // 6. Get categories
    const categories = await api.categories.list(true);
    if (categories.length === 0) {
      redirect('/onboarding/categories');
    }

  } catch (error: unknown) {
    console.error('Error in AppLayout bootstrap:', error);
    const err = error as { status?: number };
    
    // Si la sesión caducó o el token es inválido para el backend
    if (err.status === 401) {
      redirect('/login');
    }
    
    // Si el usuario tiene sesión pero no acceso al sistema
    if (err.status === 403) {
      // Idealmente podríamos mostrar una página de error 403, por ahora redirigir a un error seguro
      // Se podría añadir /access-denied. Para mvp:
      throw new Error('Access Denied');
    }

    // Cualquier otro error no contemplado, Next.js mostrará su Boundary de Error
    throw error;
  }

  return <AppShell>{children}</AppShell>;
}

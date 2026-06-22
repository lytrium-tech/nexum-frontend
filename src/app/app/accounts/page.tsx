export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { getSessionToken } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import { components } from '@/lib/api/types.generated';
import AccountsClient from './AccountsClient';

export const metadata = {
  title: 'Nexum - Billeteras',
};

export default async function AccountsPage() {
  const token = await getSessionToken(true);
  
  if (!token) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray text-center max-w-lg mx-auto mt-10">
        <h2 className="text-xl font-medium text-graphite-blue mb-2">Sesión expirada</h2>
        <p className="text-gray-500 mb-6">Por favor, inicia sesión nuevamente.</p>
        <Link href="/login" className="bg-graphite-blue text-white py-2 px-6 rounded-xl hover:bg-graphite-blue/90 font-medium">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  let accounts: components['schemas']['AccountRead'][] = [];
  let hasError = false;

  try {
    accounts = await api.accounts.list(true, { include_archived: true });
  } catch (error) {
    console.error('Error fetching accounts data:', error);
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray text-center max-w-lg mx-auto mt-10">
        <h2 className="text-xl font-medium text-graphite-blue mb-2">Error de conexión</h2>
        <p className="text-gray-500">No pudimos cargar tus cuentas. Intenta recargar la página en unos minutos.</p>
      </div>
    );
  }

  return <AccountsClient initialAccounts={accounts} />;
}

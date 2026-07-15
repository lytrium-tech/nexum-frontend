export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { getSessionToken } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import AccountDetailClient from './AccountDetailClient';

export default async function AccountDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
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

  const { id } = await params;
  const currentMonthStr = new Date().toISOString().substring(0, 7);

  let account;
  let movements;
  let summary;

  try {
    [account, movements, summary] = await Promise.all([
      api.accounts.get(id, true),
      api.accounts.getMovements(id, { limit: 50 }, true).catch((err) => { console.error('Movements fetch error:', err); return null; }),
      api.accounts.getPeriodSummary(id, currentMonthStr, true).catch((err) => { console.error('Summary fetch error:', err); return null; })
    ]);
  } catch (error: unknown) {
    console.error('Error fetching account detail:', error);
    const apiError = error as { status?: number };
    if (apiError?.status === 404) {
      return (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray text-center max-w-lg mx-auto mt-10">
          <h2 className="text-xl font-medium text-graphite-blue mb-2">Cuenta no encontrada</h2>
          <p className="text-gray-500 mb-6">La billetera que buscas no existe o no tienes acceso.</p>
          <Link href="/app/accounts" className="bg-graphite-blue text-white py-2 px-6 rounded-xl hover:bg-graphite-blue/90 font-medium transition-colors">
            Volver a Billeteras
          </Link>
        </div>
      );
    }
    
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray text-center max-w-lg mx-auto mt-10">
        <h2 className="text-xl font-medium text-graphite-blue mb-2">Error de conexión</h2>
        <p className="text-gray-500 mb-6">No pudimos cargar la información de la cuenta. Intenta recargar la página en unos minutos.</p>
        <Link href="/app/accounts" className="bg-gray-100 text-gray-700 py-2 px-6 rounded-xl hover:bg-gray-200 font-medium transition-colors">
          Volver a Billeteras
        </Link>
      </div>
    );
  }

  return <AccountDetailClient 
    initialAccount={account} 
    initialMovements={movements} 
    initialSummary={summary} 
    initialMonth={currentMonthStr}
  />;
}

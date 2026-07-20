export const dynamic = 'force-dynamic';

import React from 'react';
import { getSessionToken } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import TransferDetailClient from './TransferDetailClient';

export const metadata = {
  title: 'Nexum - Detalle de Transferencia',
};

export default async function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  let transfer;
  try {
    transfer = await api.transfers.get(id, true);
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('404')) {
      notFound();
    }
    console.error('Error fetching transfer:', error);
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray text-center max-w-lg mx-auto mt-10">
        <h2 className="text-xl font-medium text-graphite-blue mb-2">Error de conexión</h2>
        <p className="text-gray-500 mb-6">No pudimos cargar la transferencia. Intenta recargar la página en unos minutos.</p>
        <Link href="/app/transfers" className="text-graphite-blue font-medium hover:underline">
          Volver a Transferencias
        </Link>
      </div>
    );
  }

  if (!transfer) {
    notFound();
  }

  return <TransferDetailClient transfer={transfer} />;
}

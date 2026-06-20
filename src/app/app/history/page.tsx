export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { getSessionToken } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import { components } from '@/lib/api/types.generated';
import { formatLedgerAmount, getLedgerEventName } from '@/lib/format/ledger';

export const metadata = {
  title: 'Nexum - Historial Financiero',
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getEventIcon = (type: string | null | undefined) => {
  if (!type) return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">·</div>;
  switch (type.toLowerCase()) {
    case 'income': return <div className="w-8 h-8 rounded-full bg-sage-green/20 flex items-center justify-center text-sage-green">↓</div>;
    case 'expense': return <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">↑</div>;
    case 'transfer_out':
    case 'transfer_in': return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">↔</div>;
    case 'credit_card_purchase': return <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">💳</div>;
    case 'credit_card_payment':
    case 'obligation_payment': return <div className="w-8 h-8 rounded-full bg-sage-green/10 flex items-center justify-center text-sage-green">✓</div>;
    case 'goal_contribution': return <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">★</div>;
    case 'opening_balance': return <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">+</div>;
    default: return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">·</div>;
  }
};

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
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

  const resolvedSearchParams = await searchParams;

  // MVP Basic filters
  const filterType = typeof resolvedSearchParams.event_type === 'string' ? resolvedSearchParams.event_type : null;
  
  let eventsData = null;
  let hasError = false;

  try {
    const params: Record<string, string | number> = { limit: 50 };
    if (filterType) params.event_type = filterType;
    eventsData = await api.ledger.events(params, true);
  } catch (error) {
    console.error('Error fetching ledger events:', error);
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray text-center max-w-lg mx-auto mt-10">
        <h2 className="text-xl font-medium text-graphite-blue mb-2">Error de conexión</h2>
        <p className="text-gray-500">No pudimos cargar el historial. Intenta recargar la página en unos minutos.</p>
      </div>
    );
  }

  const events = eventsData?.items || [];
  const isEmpty = events.length === 0;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-10">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl shadow-sm border border-soft-gray overflow-hidden">
        <div>
          <h1 className="text-2xl font-semibold text-graphite-blue">Historial Financiero</h1>
          <p className="text-sm text-gray-500">Revisa tus movimientos recientes y pasados.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
          <Link href="/app/history" className={`shrink-0 px-4 py-2 text-sm rounded-full ${!filterType ? 'bg-graphite-blue text-white' : 'bg-gray-100 text-gray-600'}`}>
            Todos
          </Link>
          <Link href="/app/history?event_type=income" className={`shrink-0 px-4 py-2 text-sm rounded-full ${filterType === 'income' ? 'bg-sage-green text-white' : 'bg-gray-100 text-gray-600'}`}>
            Ingresos
          </Link>
          <Link href="/app/history?event_type=expense" className={`shrink-0 px-4 py-2 text-sm rounded-full ${filterType === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            Gastos
          </Link>
          <Link href="/app/history?event_type=transfer_out" className={`shrink-0 px-4 py-2 text-sm rounded-full ${filterType === 'transfer_out' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            Transf. Enviadas
          </Link>
          <Link href="/app/history?event_type=transfer_in" className={`shrink-0 px-4 py-2 text-sm rounded-full ${filterType === 'transfer_in' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            Transf. Recibidas
          </Link>
          <Link href="/app/history?event_type=credit_card_purchase" className={`shrink-0 px-4 py-2 text-sm rounded-full ${filterType === 'credit_card_purchase' ? 'bg-graphite-blue text-white' : 'bg-gray-100 text-gray-600'}`}>
            Compras Tarjeta
          </Link>
          <Link href="/app/history?event_type=goal_contribution" className={`shrink-0 px-4 py-2 text-sm rounded-full ${filterType === 'goal_contribution' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            Aportes Metas
          </Link>
        </div>
      </div>

      {isEmpty ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-soft-gray text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-graphite-blue mb-2">No hay movimientos aún</h2>
          <p className="text-gray-500 mb-6">Cuando registres movimientos, aparecerán aquí.</p>
          <Link href="/app/chat" className="bg-graphite-blue text-white py-2 px-6 rounded-xl hover:bg-graphite-blue/90 transition-colors font-medium">
            Registrar Movimiento
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-soft-gray overflow-hidden">
          <div className="divide-y divide-soft-gray">
            {events.map((evt: components['schemas']['LedgerEventDetail']) => (
              <div key={evt.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors flex items-center gap-4">
                {getEventIcon(evt.event_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate capitalize">
                    {getLedgerEventName(evt.event_type)}
                  </p>
                  {evt.description && (
                    <p className="text-xs text-gray-600 truncate mb-0.5">
                      {evt.description}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    {formatDate(evt.occurred_at)}
                    {evt.category?.name && ` • ${evt.category.name}`}
                    {evt.account?.name && ` • ${evt.account.name}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-base font-semibold ${formatLedgerAmount({ amount: evt.amount, currency: evt.currency, direction: evt.direction, eventType: evt.event_type }).startsWith('+') ? 'text-sage-green' : 'text-gray-900'}`}>
                    {formatLedgerAmount({ amount: evt.amount, currency: evt.currency, direction: evt.direction, eventType: evt.event_type })}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase">{evt.currency || 'COP'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

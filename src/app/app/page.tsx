export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { getSessionToken } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import FinancialHero from '@/components/home/FinancialHero';
import CashflowSummary from '@/components/home/CashflowSummary';
import DebtOverview from '@/components/home/DebtOverview';
import GoalsPreview from '@/components/home/GoalsPreview';
import ObligationsPreview from '@/components/home/ObligationsPreview';

export const metadata = {
  title: 'Nexum - Dashboard',
};

export default async function AppHome() {
  const token = await getSessionToken(true);
  
  if (!token) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray text-center">
        <h2 className="text-xl font-medium text-graphite-blue mb-2">Sesión expirada</h2>
        <p className="text-gray-500 mb-6">Por favor, inicia sesión nuevamente para ver tu dashboard.</p>
        <Link href="/login" className="bg-graphite-blue text-white py-2 px-6 rounded-xl hover:bg-graphite-blue/90 transition-colors font-medium">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  let snapshot = null;
  let recentEvents: any = null;
  let hasError = false;
  let isForbidden = false;

  try {
    const [snap, evts] = await Promise.all([
      api.intelligence.snapshot(true),
      api.ledger.events({ limit: 5 }, true).catch(() => null)
    ]);
    snapshot = snap;
    recentEvents = evts;
  } catch (error: unknown) {
    console.error('Failed to load dashboard data:', error);
    const err = error as { status?: number };
    if (err?.status === 401 || err?.status === 403) {
      isForbidden = true;
    } else {
      hasError = true;
    }
  }

  if (isForbidden) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray text-center">
        <h2 className="text-xl font-medium text-graphite-blue mb-2">Acceso Denegado</h2>
        <p className="text-gray-500 mb-6">No tienes permisos para ver esta información o tu sesión es inválida.</p>
        <Link href="/login" className="bg-graphite-blue text-white py-2 px-6 rounded-xl hover:bg-graphite-blue/90 transition-colors font-medium">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-graphite-blue mb-2">Servicio temporalmente no disponible</h2>
        <p className="text-gray-500">
          No pudimos conectar con el servidor para cargar tu información financiera. Por favor, intenta de nuevo en unos minutos.
        </p>
      </div>
    );
  }

  if (!snapshot) {
    // This handles the empty general state if snapshot is completely missing for some other reason
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-graphite-blue mb-2">Configuración Incompleta</h2>
        <p className="text-gray-500 mb-6">
          Aún no hay suficientes datos para generar tu panorama financiero.
        </p>
        <Link href="/app/chat" className="bg-graphite-blue text-white py-2 px-6 rounded-xl hover:bg-graphite-blue/90 transition-colors font-medium">
          Añadir Movimientos
        </Link>
      </div>
    );
  }

  const isCompletelyEmpty = 
    parseFloat(snapshot.cash.total_balance) === 0 && 
    parseFloat(snapshot.cashflow.income) === 0 && 
    parseFloat(snapshot.cashflow.expenses) === 0;

  if (isCompletelyEmpty) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-soft-gray text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-graphite-blue mb-2">Comienza a registrar tus movimientos</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Tu dashboard tomará vida cuando registres tus primeros ingresos o gastos. Puedes hacerlo hablándole al asistente.
        </p>
        <Link href="/app/chat" className="bg-graphite-blue text-white py-2 px-6 rounded-xl hover:bg-graphite-blue/90 transition-colors font-medium inline-block">
          Hablar con Nexum
        </Link>
      </div>
    );
  }

  const events = recentEvents?.items || [];

  return (
    <div className="flex flex-col gap-6">
      <FinancialHero 
        availableReal={snapshot.cash.total_balance}
        safeMoney={'0'} // No longer in snapshot
        freeMoney={snapshot.cashflow.net_cashflow}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CashflowSummary 
          income={snapshot.cashflow.income}
          cashOutflow={snapshot.cashflow.expenses}
          committedOutflow={'0'} // Replaced logic
        />
        
        <DebtOverview 
          creditCardDebt={snapshot.debt.credit_card_total_debt}
          creditCardRequiredPayment={snapshot.debt.billed_debt}
        />
        
        <GoalsPreview 
          wealthAllocation={snapshot.goals.total_saved}
          goalsRequired={snapshot.goals.total_target}
        />
        
        <ObligationsPreview 
          pendingObligationsTotal={snapshot.obligations.pending_amount}
        />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-soft-gray mt-2">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-semibold text-graphite-blue">Actividad Reciente</h3>
          <Link href="/app/history" className="text-sm font-medium text-sage-green hover:underline">
            Ver historial
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            Aún no hay actividad reciente.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt: any) => (
              <div key={evt.id} className="flex justify-between items-center pb-3 border-b border-soft-gray last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">{evt.event_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">{new Date(evt.occurred_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-semibold ${evt.direction === 'in' ? 'text-sage-green' : 'text-gray-800'}`}>
                  {evt.direction === 'in' ? '+' : '-'}${parseFloat(evt.amount).toLocaleString('es-CO')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

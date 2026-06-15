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
  let hasError = false;
  let isForbidden = false;

  try {
    snapshot = await api.intelligence.snapshot(true);
  } catch (error: unknown) {
    console.error('Failed to load snapshot:', error);
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
    parseFloat(snapshot.available_real) === 0 && 
    parseFloat(snapshot.total_income_current_month) === 0 && 
    parseFloat(snapshot.cash_consumption_outflow) === 0;

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

  return (
    <div className="flex flex-col gap-6">
      <FinancialHero 
        availableReal={snapshot.available_real}
        safeMoney={snapshot.safe_money}
        freeMoney={snapshot.free_money}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CashflowSummary 
          income={snapshot.total_income_current_month}
          cashOutflow={snapshot.cash_consumption_outflow}
          committedOutflow={snapshot.committed_outflow_current_month}
        />
        
        <DebtOverview 
          creditCardDebt={snapshot.total_credit_card_debt}
          creditCardRequiredPayment={snapshot.credit_cards_required_payment}
        />
        
        <GoalsPreview 
          wealthAllocation={snapshot.wealth_allocation_current_month}
          goalsRequired={snapshot.goals_required_this_period}
        />
        
        <ObligationsPreview 
          pendingObligationsTotal={snapshot.pending_obligations_total}
        />
      </div>
    </div>
  );
}

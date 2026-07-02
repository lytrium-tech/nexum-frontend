'use client';

import React from 'react';
import { components } from '@/lib/api/types.generated';

type ObligationRead = components['schemas']['ObligationRead'];
type AccountRead = components['schemas']['AccountRead'];

interface ObligationsClientProps {
  initialObligations: ObligationRead[];
  accounts: AccountRead[];
}

export default function ObligationsClient({ initialObligations: _initialObligations, accounts: _accounts }: ObligationsClientProps) {
  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-graphite-blue sm:text-3xl">
          Obligaciones
        </h1>
        <p className="mt-2 text-sm text-graphite-blue/60 sm:text-base">
          Controla tus compromisos y pagos pendientes.
        </p>
      </div>

      <div className="flex h-[50vh] flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-graphite-blue/10 shadow-sm">
        <svg className="w-12 h-12 text-blue-500 mb-4 animate-[spin_3s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <h2 className="text-xl font-semibold text-graphite-blue mb-2">Actualización en progreso</h2>
        <p className="text-graphite-blue/70 max-w-md">
          Obligaciones se están actualizando al nuevo sistema V1.6. Las funciones de pago estarán disponibles próximamente.
        </p>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { components } from '@/lib/api/types.generated';
import { formatMoneyOrDash } from '@/lib/format/money';

type TransferResult = components['schemas']['TransferResult'];

interface TransferDetailClientProps {
  transfer: TransferResult;
}

export default function TransferDetailClient({ transfer }: TransferDetailClientProps) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCrossCurrency = transfer.target_currency && transfer.currency !== transfer.target_currency;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-10">
      <Link href="/app/transfers" className="inline-flex items-center gap-2 text-gray-500 hover:text-graphite-blue transition-colors self-start font-medium text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Volver a Transferencias
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-soft-gray overflow-hidden">
        <div className="p-8 text-center border-b border-soft-gray bg-gray-50/50">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-graphite-blue mb-2">
            Transferencia {transfer.status === 'completed' ? 'realizada' : transfer.status === 'failed' ? 'fallida' : 'procesando'}
          </h1>
          <p className="text-gray-500 text-sm">
            {formatDate(transfer.created_at)}
          </p>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          <div className="flex flex-col gap-6 relative">
            <div className="bg-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-200 shadow-sm relative z-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Cuenta de Origen</p>
                  <p className="font-medium text-graphite-blue text-lg">{transfer.source_account?.name || 'Cuenta eliminada'}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-bold text-2xl text-graphite-blue">{formatMoneyOrDash(transfer.amount, transfer.currency)}</p>
                <p className="text-xs text-gray-400 uppercase font-medium">{transfer.currency}</p>
              </div>
            </div>

            <div className="absolute left-10 sm:left-1/2 top-1/2 -translate-y-1/2 sm:-translate-x-1/2 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center z-10 shadow-sm rotate-90 sm:rotate-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>

            <div className="bg-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-200 shadow-sm relative z-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Cuenta de Destino</p>
                  <p className="font-medium text-graphite-blue text-lg">{transfer.destination_account?.name || 'Cuenta eliminada'}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-bold text-2xl text-graphite-blue">
                  {formatMoneyOrDash(isCrossCurrency ? transfer.target_amount! : transfer.amount, isCrossCurrency ? transfer.target_currency! : transfer.currency)}
                </p>
                <p className="text-xs text-gray-400 uppercase font-medium">{isCrossCurrency ? transfer.target_currency : transfer.currency}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Detalles de la operación</h3>

            {transfer.description && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-sm pb-4 border-b border-gray-200">
                <span className="text-gray-500">Descripción</span>
                <span className="font-medium text-graphite-blue text-left sm:text-right">{transfer.description}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-sm pb-4 border-b border-gray-200">
              <span className="text-gray-500">Estado</span>
              <span className="font-medium text-graphite-blue capitalize">{transfer.status}</span>
            </div>

            {isCrossCurrency && transfer.fx_rate && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-sm pb-4 border-b border-gray-200">
                  <span className="text-gray-500">Tasa de cambio</span>
                  <span className="font-medium text-graphite-blue">
                    1 {transfer.currency} = {formatMoneyOrDash(transfer.fx_rate, transfer.target_currency!)}
                  </span>
                </div>
                {transfer.rate_source && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-sm pb-4 border-b border-gray-200">
                    <span className="text-gray-500">Proveedor FX</span>
                    <span className="font-medium text-graphite-blue">{transfer.rate_source}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-sm">
              <span className="text-gray-500">Fecha y hora</span>
              <span className="font-medium text-graphite-blue text-left sm:text-right">{formatDate(transfer.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { components } from '@/lib/api/types.generated';
import { createTransferAction, getFXSnapshotAction, getTransfersAction } from './actions';
import { formatMoneyOrDash } from '@/lib/format/money';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { emitFinancialEvent } from '@/lib/browser/financial-events';

type TransferResult = components['schemas']['TransferResult'];
type AccountRead = components['schemas']['AccountRead'];
type FXRateSnapshotResponse = components['schemas']['FXRateSnapshotResponse'];

interface TransfersClientProps {
  initialTransfers: TransferResult[];
  accounts: AccountRead[];
}

function createSafeUuid(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('').replace(
      /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
      '$1-$2-$3-$4-$5'
    );
  }

  throw new Error('Secure UUID generation is unavailable.');
}

export default function TransfersClient({ initialTransfers, accounts }: TransfersClientProps) {
  const [transfers, setTransfers] = useState<TransferResult[]>(initialTransfers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<TransferResult | null>(null);

  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');

  const [commandId, setCommandId] = useState<string>(() => createSafeUuid());
  const router = useRouter();
  const [syncNotice, setSyncNotice] = useState(false);
  const prevAccountsRef = useRef(accounts);

  useEffect(() => {
    if (prevAccountsRef.current !== accounts) {
      if (isCreateModalOpen && !successResult) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSyncNotice(true);
      }
      prevAccountsRef.current = accounts;
    }
  }, [accounts, isCreateModalOpen, successResult]);

  // FX state
  const [fxSnapshot, setFxSnapshot] = useState<FXRateSnapshotResponse | null>(null);
  const [isFxLoading, setIsFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const LIMIT = 50;
  const [offset, setOffset] = useState(initialTransfers.length);
  const [hasMore, setHasMore] = useState(initialTransfers.length >= LIMIT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setLoadError(null);
    const res = await getTransfersAction(LIMIT, offset);
    if (res.success && res.results) {
      setTransfers(prev => {
        // filter out potential duplicates just in case
        const existingIds = new Set(prev.map(t => t.id));
        const newTransfers = res.results!.filter(t => !existingIds.has(t.id));
        return [...prev, ...newTransfers];
      });
      setOffset(prev => prev + res.results!.length);
      if (res.results!.length < LIMIT) {
        setHasMore(false);
      }
    } else {
      setLoadError(res.error || 'Error al cargar más transferencias.');
    }
    setIsLoadingMore(false);
  };

  useEffect(() => {
    // Tick every second to evaluate FX expiry
    if (fxSnapshot) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [fxSnapshot]);

  const activeAccounts = accounts.filter(a => a.is_active);

  const sourceAccount = activeAccounts.find(a => a.id === sourceAccountId);
  
  // Filtering for destination: active, different from source (cross-currency is allowed!)
  const eligibleDestinationAccounts = activeAccounts.filter(a => 
    sourceAccount ? a.id !== sourceAccountId : false
  );

  const destinationAccount = eligibleDestinationAccounts.find(a => a.id === destinationAccountId);

  const isCrossCurrency = sourceAccount && destinationAccount && sourceAccount.currency !== destinationAccount.currency;

  const fetchFXSnapshot = async (baseCurrency: string, quoteCurrency: string) => {
    setIsFxLoading(true);
    setFxError(null);
    setFxSnapshot(null);
    
    const res = await getFXSnapshotAction(baseCurrency, quoteCurrency);
    if (res.success && res.snapshot) {
      setFxSnapshot(res.snapshot);
    } else {
      setFxError(res.error || 'Error al obtener la tasa de cambio.');
    }
    setIsFxLoading(false);
    setNow(new Date().getTime());
  };

  useEffect(() => {
    if (isCrossCurrency && sourceAccount && destinationAccount) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchFXSnapshot(sourceAccount.currency, destinationAccount.currency);
    } else {
      setFxSnapshot(null);
      setFxError(null);
      setIsFxLoading(false);
    }
  }, [isCrossCurrency, sourceAccount, destinationAccount]);

  const handleSourceChange = (newSourceId: string) => {
    setSourceAccountId(newSourceId);
    
    // Check if current destination is still eligible with the new source
    const newSource = activeAccounts.find(a => a.id === newSourceId);
    if (newSource) {
      const isStillEligible = activeAccounts.some(a => 
        a.id === destinationAccountId && 
        a.id !== newSourceId
      );
      if (!isStillEligible) {
        setDestinationAccountId('');
      }
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const amount = parseFloat(amountStr);
  const isValidAmount = !isNaN(amount) && amount > 0;
  
  // Max 2 decimals
  const hasValidDecimals = amountStr === '' || /^\d+(\.\d{1,2})?$/.test(amountStr);

  const isFxExpired = fxSnapshot ? now >= new Date(fxSnapshot.expires_at).getTime() : false;
  const isFxStale = fxSnapshot?.stale || false;

  let isFormValid = true;
  if (!sourceAccount) isFormValid = false;
  if (!destinationAccount) isFormValid = false;
  if (!isValidAmount || !hasValidDecimals) isFormValid = false;
  if (sourceAccount && isValidAmount && amount > parseFloat((sourceAccount.available_balance ?? sourceAccount.balance) as string)) isFormValid = false;

  if (isSubmitting) isFormValid = false;
  if (!commandId) isFormValid = false;
  if (isCrossCurrency) {
    if (isFxLoading || fxError || !fxSnapshot || isFxExpired || isFxStale) {
      isFormValid = false;
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid || !sourceAccount || !destinationAccount || !commandId) return;

    setError(null);
    setIsSubmitting(true);

    const payload: components['schemas']['TransferRequest'] = {
      source_account_id: sourceAccount.id,
      destination_account_id: destinationAccount.id,
      amount: amount.toString(),
      description: description.trim() || null,
      command_id: commandId,
      rate_snapshot_id: isCrossCurrency && fxSnapshot ? fxSnapshot.id : null,
    };

    const res = await createTransferAction(payload, commandId);

    if (res.success && res.result) {
      setSuccessResult(res.result);
      // Prepend to list
      setTransfers(prev => [res.result!, ...prev]);
      setOffset(prev => prev + 1); // Account for the new item in db offset
      // Regenerate command_id for future transfers
      setCommandId(createSafeUuid());
      // Clear FX
      setFxSnapshot(null);

      emitFinancialEvent({
        type: 'transfer_completed',
        sourceAccountId: sourceAccount.id,
        destinationAccountId: destinationAccount.id,
        transferId: res.result.id,
      });
    } else {
      setError(res.error || 'Ocurrió un error inesperado al registrar la transferencia.');
      
      // If error is related to FX, we should force a refresh or at least allow it
      if (res.error?.includes('tasa') || res.error?.includes('cambio')) {
        // Just let the user click update manually, the backend rejected the snapshot
      }

      const e = (res.error || '').toLowerCase();
      if (
        e.includes('saldo') ||
        e.includes('fondos') ||
        e.includes('inactiva') ||
        e.includes('disponible') ||
        e.includes('válido')
      ) {
        router.refresh();
      }
    }
    
    setIsSubmitting(false);
  };

  const resetFormAndClose = () => {
    setIsCreateModalOpen(false);
    setSuccessResult(null);
    setSourceAccountId('');
    setDestinationAccountId('');
    setAmountStr('');
    setDescription('');
    setError(null);
    setFxSnapshot(null);
    setFxError(null);
    setCommandId(createSafeUuid());
    setSyncNotice(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-soft-gray">
        <div>
          <h1 className="text-2xl font-semibold text-graphite-blue">Transferencias</h1>
          <p className="text-sm text-gray-500">Mueve dinero entre tus cuentas sin alterar tus ingresos ni gastos.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-graphite-blue text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-graphite-blue/90 transition-colors shadow-sm"
        >
          Nueva transferencia
        </button>
      </div>

      {transfers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-soft-gray text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-graphite-blue mb-2">Aún no hay transferencias registradas.</h2>
          <p className="text-gray-500 mb-6">Cuando muevas dinero entre tus cuentas, el historial aparecerá aquí.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-graphite-blue text-white py-2 px-6 rounded-xl hover:bg-graphite-blue/90 transition-colors font-medium"
          >
            Registrar Transferencia
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-soft-gray overflow-hidden">
          <div className="divide-y divide-soft-gray">
            {transfers.map((t) => (
              <Link href={`/app/transfers/${t.id}`} key={t.id} className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors focus:bg-gray-50 focus:outline-none">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-graphite-blue shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-graphite-blue flex items-center gap-2">
                      {t.source_account?.name || 'Cuenta Origen'} 
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg> 
                      {t.destination_account?.name || 'Cuenta Destino'}
                    </p>
                    {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.created_at)}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  {t.target_currency && t.currency !== t.target_currency ? (
                    <>
                      <p className="text-xs text-gray-500 font-medium">
                        Transferiste {formatMoneyOrDash(t.amount, t.currency)}
                      </p>
                      <p className="text-base font-semibold text-graphite-blue mt-0.5">
                        {t.is_estimated ? '≈ ' : ''}{formatMoneyOrDash(t.target_amount, t.target_currency)} <span className="text-xs text-gray-500 uppercase font-medium">recibidos</span>
                      </p>
                      {t.fx_rate && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          Tasa: 1 {t.currency} = {formatMoneyOrDash(t.fx_rate, t.target_currency)}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-graphite-blue">
                        {formatMoneyOrDash(t.amount, t.currency)}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase">{t.currency}</p>
                    </>
                  )}
                </div>
              </div>
              </Link>
            ))}
          </div>

          {(hasMore || isLoadingMore || loadError) && (
            <div className="p-6 border-t border-soft-gray flex flex-col items-center justify-center">
              {loadError && (
                <div className="text-red-500 text-sm mb-4">
                  {loadError}
                </div>
              )}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2 bg-white border border-gray-200 text-graphite-blue rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoadingMore ? 'Cargando...' : 'Cargar más'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-blue/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-soft-gray max-h-screen flex flex-col">
            
            {successResult ? (
              <div className="p-8 text-center overflow-y-auto">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-graphite-blue mb-2">Transferencia realizada</h3>
                <p className="text-gray-500 text-sm mb-6">Tu dinero ha sido transferido exitosamente.</p>
                
                <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 mb-8 border border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Origen</span>
                    <span className="font-medium text-graphite-blue">{successResult.source_account?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Destino</span>
                    <span className="font-medium text-graphite-blue">{successResult.destination_account?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Monto enviado</span>
                    <span className="font-medium text-graphite-blue">{formatMoneyOrDash(successResult.amount, successResult.currency)}</span>
                  </div>
                  {successResult.target_amount && successResult.target_currency && successResult.currency !== successResult.target_currency && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 mt-2">
                      <span className="text-gray-500">Monto recibido</span>
                      <span className="font-medium text-graphite-blue">{formatMoneyOrDash(successResult.target_amount, successResult.target_currency)}</span>
                    </div>
                  )}
                  {successResult.fx_rate && (
                    <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                      <span>Tasa de cambio</span>
                      <span>1 {successResult.currency} = {formatMoneyOrDash(successResult.fx_rate, successResult.target_currency!)}</span>
                    </div>
                  )}
                  {successResult.rate_source && (
                    <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                      <span>Proveedor</span>
                      <span>{successResult.rate_source}</span>
                    </div>
                  )}
                  {successResult.is_idempotent && (
                    <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-200 mt-2">
                      <span>Nota</span>
                      <span>Esta operación ya había sido procesada.</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={resetFormAndClose}
                  className="w-full py-3 bg-graphite-blue text-white rounded-xl font-medium hover:bg-graphite-blue/90 transition-colors text-sm"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-soft-gray flex justify-between items-center shrink-0">
                  <h3 className="text-xl font-semibold text-graphite-blue">Nueva Transferencia</h3>
                  <button 
                    onClick={resetFormAndClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto">
                  {syncNotice && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-graphite-blue text-sm flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>Los saldos se actualizaron porque hubo cambios en otra pestaña.</span>
                    </div>
                  )}

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm" aria-describedby="transfer-error">
                      <span id="transfer-error">{error}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="source_account_id" className="block text-sm font-medium text-gray-700 mb-1">Cuenta Origen</label>
                      <select 
                        id="source_account_id"
                        value={sourceAccountId}
                        onChange={(e) => handleSourceChange(e.target.value)}
                        required 
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue focus:border-transparent outline-none bg-white text-sm"
                      >
                        <option value="">Selecciona cuenta origen...</option>
                        {activeAccounts.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} (Disp: {formatMoneyOrDash(a.available_balance ?? a.balance, a.currency)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="destination_account_id" className="block text-sm font-medium text-gray-700 mb-1">Cuenta Destino</label>
                      <select 
                        id="destination_account_id"
                        value={destinationAccountId}
                        onChange={(e) => setDestinationAccountId(e.target.value)}
                        required 
                        disabled={!sourceAccount}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue focus:border-transparent outline-none bg-white text-sm disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">{sourceAccount ? 'Selecciona cuenta destino...' : 'Primero selecciona un origen'}</option>
                        {eligibleDestinationAccounts.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} (Disp: {formatMoneyOrDash(a.available_balance ?? a.balance, a.currency)})
                          </option>
                        ))}
                      </select>
                      {sourceAccount && eligibleDestinationAccounts.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">No tienes otras cuentas disponibles.</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Monto a transferir</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                        <input 
                          id="amount"
                          type="number" 
                          value={amountStr}
                          onChange={(e) => setAmountStr(e.target.value)}
                          required 
                          min="0.01"
                          step="any"
                          placeholder="0.00"
                          className="w-full pl-8 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue focus:border-transparent outline-none text-sm"
                        />
                      </div>
                      {!hasValidDecimals && (
                        <p className="text-xs text-red-500 mt-1">El monto no puede tener más de dos decimales.</p>
                      )}
                      {sourceAccount && isValidAmount && amount > parseFloat(sourceAccount.balance as string) && (
                        <p className="text-xs text-red-500 mt-1">El monto supera tu saldo actual ({formatMoneyOrDash(sourceAccount.balance, sourceAccount.currency)}).</p>
                      )}
                    </div>

                    {isCrossCurrency && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Conversión (Estimación)</h4>
                        
                        {isFxLoading ? (
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-graphite-blue rounded-full animate-spin"></div>
                            Consultando tasa...
                          </div>
                        ) : fxError ? (
                          <div className="text-sm text-red-500">
                            {fxError}
                            <button
                              type="button"
                              onClick={() => fetchFXSnapshot(sourceAccount!.currency, destinationAccount!.currency)}
                              className="ml-2 text-graphite-blue underline font-medium"
                            >
                              Reintentar
                            </button>
                          </div>
                        ) : fxSnapshot ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Tasa de cambio</span>
                              <span className="font-medium text-graphite-blue">
                                1 {fxSnapshot.from_currency} = {formatMoneyOrDash(fxSnapshot.rate, fxSnapshot.to_currency)}
                              </span>
                            </div>
                            
                            {isValidAmount ? (
                              <div className="flex justify-between items-center text-sm pt-1">
                                <span className="text-gray-600">Recibes aprox.</span>
                                <span className="font-semibold text-graphite-blue">
                                  {formatMoneyOrDash((amount * parseFloat(fxSnapshot.rate as string)).toString(), fxSnapshot.to_currency)}
                                </span>
                              </div>
                            ) : null}

                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                              <span className="text-[10px] text-gray-400">
                                {fxSnapshot.source ? `Ref: ${fxSnapshot.source}` : 'Tasa de referencia'}
                              </span>
                              
                              {isFxExpired || isFxStale ? (
                                <span className="text-[10px] text-red-500 font-medium">
                                  {isFxStale ? 'Tasa no vigente' : 'La tasa expiró'}
                                  <button
                                    type="button"
                                    onClick={() => fetchFXSnapshot(sourceAccount!.currency, destinationAccount!.currency)}
                                    className="ml-2 underline text-red-600"
                                  >
                                    Actualizar
                                  </button>
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400">
                                  Expira en {Math.max(0, Math.floor((new Date(fxSnapshot.expires_at).getTime() - now) / 1000))}s
                                </span>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-gray-400 font-normal">(Opcional)</span></label>
                      <input 
                        id="description"
                        type="text" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Ahorro mensual"
                        maxLength={255}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-graphite-blue focus:border-transparent outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={resetFormAndClose}
                      className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid}
                      className="flex-1 px-4 py-3 bg-graphite-blue text-white rounded-xl font-medium hover:bg-graphite-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {isSubmitting ? 'Transfiriendo...' : 'Transferir'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

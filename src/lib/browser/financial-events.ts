'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const FINANCIAL_EVENTS_CHANNEL = 'nexum-financial-events';

export type FinancialEvent = {
  type: 'transfer_completed' | 'account_updated'; // Extensible para futuros eventos
  sourceAccountId?: string;
  destinationAccountId?: string;
  transferId?: string;
  occurredAt: number;
};

export function emitFinancialEvent(event: Omit<FinancialEvent, 'occurredAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const channel = new BroadcastChannel(FINANCIAL_EVENTS_CHANNEL);
    channel.postMessage({ ...event, occurredAt: Date.now() });
    channel.close();
  } catch (err) {
    console.warn('BroadcastChannel no soportado, usando fallback de localStorage', err);
    // Fallback usando StorageEvent
    const eventString = JSON.stringify({ ...event, occurredAt: Date.now() });
    localStorage.setItem(FINANCIAL_EVENTS_CHANNEL, eventString);
    localStorage.removeItem(FINANCIAL_EVENTS_CHANNEL); // Emitir sin contaminar localStorage
  }
}

export function useCrossTabSync() {
  const router = useRouter();

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    let lastProcessedTime = 0;

    const handleEvent = (eventData: FinancialEvent) => {
      // Prevenir loops o eventos duplicados en la misma ventana de tiempo
      if (eventData.occurredAt <= lastProcessedTime) return;
      lastProcessedTime = eventData.occurredAt;

      router.refresh();
    };

    try {
      channel = new BroadcastChannel(FINANCIAL_EVENTS_CHANNEL);
      channel.onmessage = (event: MessageEvent<FinancialEvent>) => {
        if (event.data && event.data.type) {
          handleEvent(event.data);
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel no soportado, activando listener de storage', err);
      const handleStorage = (e: StorageEvent) => {
        if (e.key === FINANCIAL_EVENTS_CHANNEL && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as FinancialEvent;
            if (parsed.type) {
              handleEvent(parsed);
            }
          } catch {
            // Error parseando json de storage
          }
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }

    return () => {
      if (channel) {
        channel.close();
      }
    };
  }, [router]);
}

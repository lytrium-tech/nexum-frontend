'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import { components } from '@/lib/api/types.generated';
import { handleFinancialError } from '@/lib/api/errors';

export async function createTransferAction(data: components['schemas']['TransferRequest'], idempotencyKey: string) {
  try {
    const result = await api.transfers.create(data, idempotencyKey, true);
    revalidatePath('/app/transfers');
    revalidatePath('/app/accounts');
    revalidatePath(`/app/accounts/${data.source_account_id}`);
    revalidatePath(`/app/accounts/${data.destination_account_id}`);
    revalidatePath('/app/history');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Create transfer error:', err);
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al registrar la transferencia. Intenta nuevamente.') };
  }
}

export async function getFXSnapshotAction(baseCurrency: string, quoteCurrency: string) {
  try {
    const snapshot = await api.fxV17.getLatestRate(baseCurrency, quoteCurrency, true);
    return { success: true, snapshot };
  } catch (err: unknown) {
    console.error('FX Snapshot error:', err);
    return { success: false, error: handleFinancialError(err, 'No pudimos obtener la tasa de cambio actual.') };
  }
}

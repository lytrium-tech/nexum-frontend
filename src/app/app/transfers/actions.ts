'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import { components } from '@/lib/api/types.generated';

export async function createTransferAction(data: components['schemas']['TransferCreate'], idempotencyKey: string) {
  try {
    const result = await api.transfers.create(data, idempotencyKey, true);
    revalidatePath('/app/transfers');
    revalidatePath('/app/accounts');
    revalidatePath('/app/history');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Create transfer error:', err);
    let message = 'Ocurrió un error al registrar la transferencia. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string; errorCode?: string };
    if (apiError?.status === 422) {
      if (apiError.message && typeof apiError.message === 'string' && apiError.message.toLowerCase().includes('greater than 0')) {
        message = 'El monto debe ser mayor a $0.';
      } else {
        message = 'Los datos ingresados no son válidos.';
      }
    } else if (apiError?.errorCode === 'unsupported_currency') {
      message = 'Por ahora Nexum solo soporta conversiones COP/USD.';
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== '{}') {
      message = apiError.message;
    }
    
    return { success: false, error: message };
  }
}

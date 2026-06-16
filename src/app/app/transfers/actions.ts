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
    
    const apiError = err as { status?: number; message?: string };
    if (apiError?.status === 422) {
      if (apiError.message && typeof apiError.message === 'string' && apiError.message.toLowerCase().includes('greater than 0')) {
        message = 'El monto debe ser mayor a $0.';
      } else {
        message = 'Los datos ingresados no son válidos.';
      }
    } else if (apiError?.status === 400 || apiError?.status === 403 || apiError?.status === 500) {
       message = 'No pudimos registrar esta operación. Intenta nuevamente.';
       if (apiError.message && apiError.message !== '{}') {
         const backendMsg = apiError.message.toLowerCase();
         if (backendMsg.includes('insufficient') && (backendMsg.includes('balance') || backendMsg.includes('funds'))) {
           message = 'La cuenta de origen no tiene saldo suficiente.';
         } else if (backendMsg.includes('inactive') || backendMsg.includes('inactiva')) {
           message = 'Una de las cuentas seleccionadas está inactiva.';
         } else if (backendMsg.includes('same account') || backendMsg.includes('origen y destino')) {
           message = 'La cuenta de origen y destino no pueden ser iguales.';
         } else if (backendMsg.includes('greater than 0') || backendMsg.includes('monto 0')) {
           message = 'El monto debe ser mayor a $0.';
         }
       }
    }
    
    return { success: false, error: message };
  }
}

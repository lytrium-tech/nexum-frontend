'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import { components } from '@/lib/api/types.generated';

export async function createObligationAction(data: components['schemas']['ObligationCreate']) {
  try {
    const result = await api.obligations.create(data, true);
    revalidatePath('/app/obligations');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Create obligation error:', err);
    let message = 'Ocurrió un error al crear la obligación. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string; data?: unknown };
    if (apiError?.status === 409) {
      message = 'Ya existe una obligación con este nombre o características.';
    } else if (apiError?.status === 422) {
      message = 'Los datos ingresados no son válidos.';
      if (apiError.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
        message = apiError.message;
      }
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
      message = apiError.message;
    }
    
    return { success: false, error: message };
  }
}

export async function updateObligationAction(id: string, data: components['schemas']['ObligationUpdate']) {
  try {
    const result = await api.obligations.update(id, data, true);
    revalidatePath('/app/obligations');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Update obligation error:', err);
    let message = 'Ocurrió un error al actualizar la obligación. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string; data?: unknown };
    if (apiError?.status === 422) {
      message = 'Los datos ingresados no son válidos.';
      if (apiError.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
        message = apiError.message;
      }
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
      message = apiError.message;
    }
    
    return { success: false, error: message };
  }
}

export async function payObligationAction(id: string, data: components['schemas']['ObligationPaymentCreate'], idempotencyKey: string) {
  try {
    const result = await api.obligations.pay(id, data, idempotencyKey, true);
    revalidatePath('/app/obligations');
    revalidatePath('/app/accounts');
    revalidatePath('/app/history');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Pay obligation error:', err);
    let message = 'Ocurrió un error al registrar el pago. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string; data?: unknown };
    if (apiError?.status === 422) {
      message = 'Los datos ingresados no son válidos.';
      if (apiError.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
        message = apiError.message;
      }
    } else if (apiError?.status === 400 || apiError?.status === 403 || apiError?.status === 409) {
       if (apiError.message && typeof apiError.message === 'string' && apiError.message !== '{}') {
         const backendMsg = apiError.message.toLowerCase();
         if (backendMsg.includes('match') && backendMsg.includes('quota')) {
           message = 'El pago debe coincidir exactamente con el valor de la obligación.';
         } else if (backendMsg.includes('already paid') || backendMsg.includes('paid for this period')) {
           message = 'Esta obligación ya fue pagada para este periodo.';
         } else if (backendMsg.includes('insufficient') || backendMsg.includes('fondos') || backendMsg.includes('balance')) {
           message = 'No tienes saldo suficiente en esta cuenta para realizar el pago.';
         } else {
           message = apiError.message;
         }
       }
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
      const backendMsg = apiError.message.toLowerCase();
      if (backendMsg.includes('match') && backendMsg.includes('quota')) {
        message = 'El pago debe coincidir exactamente con el valor de la obligación.';
      } else if (backendMsg.includes('already paid') || backendMsg.includes('paid for this period') || backendMsg.includes('duplicate')) {
        message = 'Esta obligación ya fue pagada para este periodo.';
      } else {
        message = apiError.message;
      }
    }
    
    return { success: false, error: message };
  }
}

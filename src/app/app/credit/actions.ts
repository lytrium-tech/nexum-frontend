'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import { components } from '@/lib/api/types.generated';

export async function createCreditCardAction(data: components['schemas']['CreditCardCreate']) {
  try {
    const result = await api.credit.cards.create(data, true);
    revalidatePath('/app/credit');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Create credit card error:', err);
    let message = 'Ocurrió un error al crear la tarjeta. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string };
    if (apiError?.status === 409) {
      message = 'Ya existe una tarjeta con este nombre o características.';
    } else if (apiError?.status === 422) {
      message = 'Los datos ingresados no son válidos.';
    } else if (apiError?.status === 400 || apiError?.status === 403 || apiError?.status === 500) {
      message = 'No pudimos registrar esta operación. Intenta nuevamente.';
    }
    
    return { success: false, error: message };
  }
}

export async function purchaseCreditCardAction(cardId: string, data: components['schemas']['CreditCardPurchaseCreate'], idempotencyKey: string) {
  try {
    const result = await api.credit.purchases.create(cardId, data, idempotencyKey, true);
    revalidatePath('/app/credit');
    revalidatePath('/app/history');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Purchase credit card error:', err);
    let message = 'Ocurrió un error al registrar la compra. Intenta nuevamente.';
    
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
         if (backendMsg.includes('insufficient limit') || backendMsg.includes('available credit') || backendMsg.includes('cupo') || backendMsg.includes('exceed')) {
           message = 'La compra supera el cupo disponible de la tarjeta.';
         } else if (backendMsg.includes('inactive') || backendMsg.includes('inactiva')) {
           message = 'La tarjeta está inactiva.';
         } else if (backendMsg.includes('greater than 0') || backendMsg.includes('monto 0')) {
           message = 'El monto debe ser mayor a $0.';
         }
       }
    }
    
    return { success: false, error: message };
  }
}

export async function payCreditCardAction(cardId: string, data: components['schemas']['CreditCardPaymentCreate'], idempotencyKey: string) {
  try {
    const result = await api.credit.payments.create(cardId, data, idempotencyKey, true);
    revalidatePath('/app/credit');
    revalidatePath('/app/accounts');
    revalidatePath('/app/history');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Pay credit card error:', err);
    let message = 'Ocurrió un error al registrar el pago. Intenta nuevamente.';
    
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
           message = 'La cuenta seleccionada no tiene saldo suficiente.';
         } else if (backendMsg.includes('exceed') && backendMsg.includes('debt')) {
           message = 'El pago no puede ser mayor a la deuda actual.';
         } else if (backendMsg.includes('inactive') || backendMsg.includes('inactiva')) {
           if (backendMsg.includes('account') || backendMsg.includes('cuenta')) {
             message = 'La cuenta seleccionada está inactiva.';
           } else {
             message = 'La tarjeta está inactiva.';
           }
         } else if (backendMsg.includes('greater than 0') || backendMsg.includes('monto 0')) {
           message = 'El monto debe ser mayor a $0.';
         }
       }
    }
    
    return { success: false, error: message };
  }
}

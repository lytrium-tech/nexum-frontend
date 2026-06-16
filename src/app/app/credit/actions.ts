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
      if (apiError.message && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
        message = apiError.message;
      }
    } else if (apiError?.message && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
      message = apiError.message;
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
      message = 'Los datos ingresados no son válidos.';
    } else if (apiError?.status === 400 || apiError?.status === 403) {
       if (apiError.message && apiError.message !== '{}') {
         const backendMsg = apiError.message.toLowerCase();
         if (backendMsg.includes('insufficient limit') || backendMsg.includes('available credit') || backendMsg.includes('cupo')) {
           message = 'No tienes cupo suficiente en esta tarjeta para realizar la compra.';
         } else {
           message = apiError.message;
         }
       }
    } else if (apiError?.message && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
      message = apiError.message;
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
      message = 'Los datos ingresados no son válidos.';
    } else if (apiError?.status === 400 || apiError?.status === 403) {
       if (apiError.message && apiError.message !== '{}') {
         const backendMsg = apiError.message.toLowerCase();
         if (backendMsg.includes('insufficient') && (backendMsg.includes('balance') || backendMsg.includes('funds'))) {
           message = 'No tienes saldo suficiente en esta cuenta para realizar el pago.';
         } else if (backendMsg.includes('exceed') && backendMsg.includes('debt')) {
           message = 'El pago no puede ser mayor a la deuda de la tarjeta.';
         } else {
           message = apiError.message;
         }
       }
    } else if (apiError?.message && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
      message = apiError.message;
    }
    
    return { success: false, error: message };
  }
}

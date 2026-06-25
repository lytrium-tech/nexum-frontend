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

export async function getCreditInstallmentsAction(cardId: string) {
  try {
    const result = await api.credit.cards.installments(cardId, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Get credit installments error:', err);
    return { success: false, error: 'Ocurrió un error al cargar el cronograma de cuotas.' };
  }
}

export async function payEarlyPurchaseAction(
  cardId: string, 
  purchaseId: string, 
  sourceAccountId: string,
  allocationMode: 'reduce_term' | 'reduce_installment_amount' = 'reduce_installment_amount'
) {
  try {
    const idempotencyKey = crypto.randomUUID();
    const data: components['schemas']['CreditCardEarlyPaymentCreate'] = {
      account_id: sourceAccountId,
      allocation_mode: allocationMode
    };
    
    const result = await api.credit.purchases.payEarly(cardId, purchaseId, data, idempotencyKey, true);
    
    revalidatePath('/app/credit');
    revalidatePath('/app/accounts');
    revalidatePath('/app/history');
    revalidatePath('/app');
    
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Pay early purchase error:', err);
    let message = 'No fue posible pagar esta compra anticipadamente.';
    
    const apiError = err as { status?: number; message?: string };
    
    if (apiError?.status === 422) {
      message = 'Los datos ingresados no son válidos.';
      if (apiError.message) {
        const backendMsg = apiError.message.toLowerCase();
        if (backendMsg.includes('source_account_id') || backendMsg.includes('account')) {
          message = 'Selecciona una cuenta válida para el pago.';
        }
      }
    } else if (apiError?.status === 404) {
      message = 'La compra no fue encontrada.';
    } else if (apiError?.status === 400 || apiError?.status === 403 || apiError?.status === 500) {
       if (apiError.message && apiError.message !== '{}') {
         const backendMsg = apiError.message.toLowerCase();
         if (backendMsg.includes('insufficient') && (backendMsg.includes('balance') || backendMsg.includes('funds'))) {
           message = 'Saldo insuficiente en la cuenta seleccionada.';
         } else if (backendMsg.includes('not eligible') || backendMsg.includes('elegible') || backendMsg.includes('status')) {
           message = 'Esta compra no es elegible para pago anticipado.';
         } else if (backendMsg.includes('frozen') || backendMsg.includes('congelado') || backendMsg.includes('statement')) {
           message = 'No se puede modificar una compra en un extracto congelado.';
         } else if (backendMsg.includes('overpayment') || backendMsg.includes('exceed')) {
           message = 'El pago supera el saldo permitido. Overpayment no está soportado.';
         } else if (backendMsg.includes('currency') || backendMsg.includes('moneda')) {
           message = 'La moneda de la cuenta no es compatible con el pago de esta compra.';
         } else if (backendMsg.includes('not found') || backendMsg.includes('purchase')) {
           message = 'La compra no fue encontrada.';
         } else if (backendMsg.includes('inactive')) {
           message = 'La tarjeta o la cuenta están inactivas.';
         }
       }
    }
    
    return { success: false, error: message };
  }
}

export async function getCreditStatementsAction(cardId: string) {
  try {
    const result = await api.credit.cards.statements(cardId, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Get credit statements error:', err);
    return { success: false, error: 'Ocurrió un error al cargar los extractos.' };
  }
}

export async function getCreditStatementDetailAction(cardId: string, period: string) {
  try {
    const result = await api.credit.cards.statement(cardId, period, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Get credit statement detail error:', err);
    return { success: false, error: 'Ocurrió un error al cargar el detalle del extracto.' };
  }
}

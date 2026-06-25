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
    
    const apiError = err as { status?: number; message?: string; errorCode?: string };
    if (apiError?.errorCode === 'unsupported_currency') {
      message = 'Por ahora Nexum solo soporta conversiones COP/USD.';
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== '{}') {
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
    
    const apiError = err as { status?: number; message?: string; errorCode?: string };
    if (apiError?.errorCode === 'unsupported_currency') {
      message = 'Por ahora Nexum solo soporta conversiones COP/USD.';
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== '{}') {
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
    
    const apiError = err as { status?: number; message?: string; errorCode?: string };
    if (apiError?.errorCode === 'unsupported_currency') {
      message = 'Por ahora Nexum solo soporta conversiones COP/USD.';
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== '{}') {
      message = apiError.message;
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
    
    const apiError = err as { status?: number; message?: string; errorCode?: string };
    if (apiError?.errorCode === 'unsupported_currency') {
      message = 'Por ahora Nexum solo soporta conversiones COP/USD.';
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== '{}') {
      message = apiError.message;
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

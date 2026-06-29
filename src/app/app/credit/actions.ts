'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import { components } from '@/lib/api/types.generated';
import { handleFinancialError } from '@/lib/api/errors';

export async function createCreditCardAction(data: components['schemas']['CreditCardCreate']) {
  try {
    const result = await api.credit.cards.create(data, true);
    revalidatePath('/app/credit');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Create credit card error:', err);
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al crear la tarjeta. Intenta nuevamente.') };
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
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al registrar la compra. Intenta nuevamente.') };
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
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al registrar el pago. Intenta nuevamente.') };
  }
}

export async function getCreditInstallmentsAction(cardId: string) {
  try {
    const result = await api.credit.cards.installments(cardId, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Get credit installments error:', err);
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al cargar el cronograma de cuotas.') };
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
    return { success: false, error: handleFinancialError(err, 'No fue posible pagar esta compra anticipadamente.') };
  }
}

export async function getCreditStatementsAction(cardId: string) {
  try {
    const result = await api.credit.cards.statements(cardId, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Get credit statements error:', err);
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al cargar los extractos.') };
  }
}

export async function getCreditStatementDetailAction(cardId: string, period: string) {
  try {
    const result = await api.credit.cards.statement(cardId, period, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Get credit statement detail error:', err);
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al cargar el detalle del extracto.') };
  }
}

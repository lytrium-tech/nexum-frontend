'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import { components } from '@/lib/api/types.generated';
import { handleFinancialError } from '@/lib/api/errors';

export async function createObligationAction(data: components['schemas']['ObligationCreate']) {
  try {
    const result = await api.obligations.create(data, true);
    revalidatePath('/app/obligations');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Create obligation error:', err);
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al crear la obligación. Intenta nuevamente.') };
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
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al actualizar la obligación. Intenta nuevamente.') };
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
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al registrar el pago. Intenta nuevamente.') };
  }
}
export async function previewObligationPaymentAction(id: string, data: components['schemas']['ObligationPaymentPreviewCreate']) {
  try {
    const result = await api.obligations.payPreview(id, data, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Preview obligation payment error:', err);
    return { success: false, error: handleFinancialError(err, 'No pudimos calcular la vista previa.') };
  }
}

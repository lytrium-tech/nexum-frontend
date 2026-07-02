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

// export async function updateObligationAction(id: string, data: any) {
//   try {
//     const result = await api.obligations.update(id, data, true);
//     revalidatePath('/app/obligations');
//     revalidatePath('/app');
//     return { success: true, result };
//   } catch (err: unknown) {
//     console.error('Update obligation error:', err);
//     return { success: false, error: handleFinancialError(err, 'Ocurrió un error al actualizar la obligación. Intenta nuevamente.') };
//   }
// }

export async function payObligationFifoAction(id: string, data: components['schemas']['ObligationPaymentCreate'], idempotencyKey: string) {
  try {
    const result = await api.obligations.pay(id, data, idempotencyKey, true);
    revalidatePath('/app/obligations');
    revalidatePath('/app/accounts');
    revalidatePath('/app/history');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Pay obligation fifo error:', err);
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al registrar el pago. Intenta nuevamente.') };
  }
}
// export async function previewObligationPaymentAction(id: string, data: any) {
//   try {
//     const result = await api.obligations.payPreview(id, data, true);
//     return { success: true, result };
//   } catch (err: unknown) {
//     console.error('Preview obligation payment error:', err);
//     return { success: false, error: handleFinancialError(err, 'No pudimos calcular la vista previa.') };
//   }
// }

export async function getObligationPeriodsAction(id: string) {
  try {
    const result = await api.obligations.periods(id, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Get obligation periods error:', err);
    return { success: false, error: handleFinancialError(err, 'No encontramos esta obligación.') };
  }
}

export async function syncObligationPeriodsAction(id: string) {
  try {
    const result = await api.obligations.syncPeriods(id, true);
    revalidatePath('/app/obligations');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Sync obligation periods error:', err);
    return { success: false, error: handleFinancialError(err, 'No pudimos procesar esta operación en este momento.') };
  }
}

export async function updateObligationPeriodAmountAction(periodId: string, amount: string) {
  try {
    const result = await api.obligations.updatePeriodAmount(periodId, { amount }, true);
    revalidatePath('/app/obligations');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Update period amount error:', err);
    return { success: false, error: handleFinancialError(err, 'No encontramos este periodo.') };
  }
}

export async function payObligationPeriodAction(periodId: string, data: components['schemas']['ObligationPaymentCreate'], idempotencyKey: string) {
  try {
    const result = await api.obligations.payPeriod(periodId, data, idempotencyKey, true);
    revalidatePath('/app/obligations');
    revalidatePath('/app/accounts');
    revalidatePath('/app/history');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Pay period error:', err);
    return { success: false, error: handleFinancialError(err, 'Este periodo no permite esta acción.') };
  }
}

export async function skipObligationPeriodAction(periodId: string) {
  try {
    const result = await api.obligations.skipPeriod(periodId, true);
    revalidatePath('/app/obligations');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Skip period error:', err);
    return { success: false, error: handleFinancialError(err, 'Este periodo no permite esta acción.') };
  }
}

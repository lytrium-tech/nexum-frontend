'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import { components } from '@/lib/api/types.generated';
import { handleFinancialError } from '@/lib/api/errors';

export async function createGoalAction(data: components['schemas']['GoalCreate']) {
  try {
    const result = await api.goals.create(data, true);
    revalidatePath('/app/goals');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Create goal error:', err);
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al crear la meta. Intenta nuevamente.') };
  }
}

export async function updateGoalAction(id: string, data: components['schemas']['GoalUpdate']) {
  try {
    const result = await api.goals.update(id, data, true);
    revalidatePath('/app/goals');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Update goal error:', err);
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al actualizar la meta. Intenta nuevamente.') };
  }
}

export async function contributeGoalAction(id: string, data: components['schemas']['GoalContributionCreate'], idempotencyKey: string) {
  try {
    const result = await api.goals.contribute(id, data, idempotencyKey, true);
    revalidatePath('/app/goals');
    revalidatePath('/app/accounts');
    revalidatePath('/app/history');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Contribute goal error:', err);
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al registrar el aporte. Intenta nuevamente.') };
  }
}

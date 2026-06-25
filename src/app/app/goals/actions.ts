'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import { components } from '@/lib/api/types.generated';

export async function createGoalAction(data: components['schemas']['GoalCreate']) {
  try {
    const result = await api.goals.create(data, true);
    revalidatePath('/app/goals');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Create goal error:', err);
    let message = 'Ocurrió un error al crear la meta. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string; data?: unknown };
    if (apiError?.status === 409) {
      message = 'Ya existe una meta con este nombre.';
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

export async function updateGoalAction(id: string, data: components['schemas']['GoalUpdate']) {
  try {
    const result = await api.goals.update(id, data, true);
    revalidatePath('/app/goals');
    revalidatePath('/app');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Update goal error:', err);
    let message = 'Ocurrió un error al actualizar la meta. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string; data?: unknown };
    if (apiError?.status === 409) {
      message = 'Ya existe una meta con este nombre.';
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
    let message = 'Ocurrió un error al registrar el aporte. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string; errorCode?: string; data?: unknown };
    if (apiError?.status === 422) {
      message = 'Los datos ingresados no son válidos.';
      if (apiError.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
        message = apiError.message;
      }
    } else if (apiError?.errorCode === 'unsupported_currency') {
      message = 'Por ahora Nexum solo soporta conversiones COP/USD.';
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
      message = apiError.message;
    }
    
    return { success: false, error: message };
  }
}

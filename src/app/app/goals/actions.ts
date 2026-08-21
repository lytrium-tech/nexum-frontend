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

export async function getGoalDetailAction(id: string) {
  try {
    const result = await api.goals.get(id, true);
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Get goal detail error:', err);
    return { success: false, error: handleFinancialError(err, 'No pudimos cargar los detalles de la meta.') };
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
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Contribute goal error:', err);
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al registrar el aporte. Intenta nuevamente.') };
  }
}

export async function releaseGoalAction(id: string, data: components['schemas']['GoalReleaseCreate'], idempotencyKey: string) {
  try {
    const result = await api.goals.release(id, data, idempotencyKey, true);
    revalidatePath('/app/goals');
    revalidatePath('/app/accounts');
    revalidatePath('/app/history');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Release goal error:', err);
    let message = 'No pudimos liberar el dinero. Revisa los datos e inténtalo nuevamente.';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiError = err as any;
    const errorCode = apiError?.errorCode;
    const backendMessage = apiError?.message || '';

    if (errorCode === 'goal_not_active' || errorCode === 'goal_completed' || errorCode === 'goal_forbidden') {
      message = 'Esta meta ya no permite liberar dinero.';
    } else if (errorCode === 'not_found') {
      if (backendMessage.includes('Cuenta')) {
        message = 'La cuenta seleccionada ya no está disponible.';
      } else {
        message = 'No pudimos encontrar la meta o la cuenta.';
      }
    } else if (errorCode === 'forbidden' && backendMessage.includes('Cuenta inactiva')) {
      message = 'La cuenta seleccionada ya no está disponible.';
    } else if (errorCode === 'conflict' && (backendMessage.includes('reserva') || backendMessage.includes('insuficiente'))) {
      message = 'El monto supera el dinero reservado desde esta cuenta.';
    } else if (errorCode === 'goal_amount_exceeded') {
      message = 'El monto supera el dinero reservado desde esta cuenta.';
    } else if (errorCode === 'conflict' && (backendMessage.includes('Idempotency-Key') || backendMessage.includes('idempotencia'))) {
      message = 'La operación ya fue procesada con datos distintos.';
    } else if (apiError?.status === 422) {
      const detailMsg = Array.isArray(apiError?.detail) ? apiError.detail.map((d: { msg?: string; type?: string }) => d.msg || d.type).join(', ') : (apiError?.detail || backendMessage);
      message = detailMsg ? `Validación fallida: ${detailMsg}` : 'No pudimos liberar el dinero. Revisa los datos e inténtalo nuevamente.';
    }

    return { success: false, error: message };
  }
}

export async function getGoalAutoContributionAction(goalId: string) {
  try {
    const result = await api.goals.autoContribution.get(goalId, true);
    return { success: true, result };
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiError = err as any;
    if (apiError?.status === 404) {
      return { success: true, result: null }; // 404 means not configured
    }
    console.error('Get goal auto contribution error:', err);
    return { success: false, error: handleFinancialError(err, 'No pudimos cargar la configuración de aportes automáticos.') };
  }
}


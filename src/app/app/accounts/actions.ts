'use server';

import { api } from '@/lib/api/endpoints';
import { components } from '@/lib/api/types.generated';
import { revalidatePath } from 'next/cache';

export async function createAccountAction(data: {
  name: string;
  type: string;
  currency: string;
  initial_balance: string | number;
}) {
  try {
    const account = await api.accounts.create({
      name: data.name,
      type: data.type as components['schemas']['AccountType'],
      currency: data.currency,
      initial_balance: data.initial_balance
    }, true);
    
    revalidatePath('/app/accounts');
    return { success: true, account };
  } catch (err: unknown) {
    console.error('Create account action error:', err);
    let message = 'Ocurrió un error al crear la cuenta. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string };
    if (apiError?.status === 409 || (apiError?.message && typeof apiError.message === 'string' && apiError.message.includes('already exists'))) {
      message = 'Ya existe una cuenta con este nombre.';
    } else if (apiError?.status === 422) {
      message = 'Los datos ingresados no son válidos.';
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado') {
      // Use the specific safe error message returned by backend if available
      message = apiError.message;
    }
    
    return { success: false, error: message };
  }
}


export async function updateAccountAction(id: string, data: { name?: string; type?: string }) {
  try {
    const payload: Record<string, string> = {};
    if (data.name) payload.name = data.name;
    if (data.type) payload.type = data.type;
    await api.accounts.update(id, payload, true);
    revalidatePath('/app/accounts');
    revalidatePath(`/app/accounts/${id}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('Update account action error:', err);
    let message = 'No pudimos actualizar la cuenta.';
    const apiError = err as { status?: number; message?: string };
    if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado') {
      message = apiError.message;
    }
    return { success: false, error: message };
  }
}

export async function archiveAccountAction(id: string) {
  try {
    await api.accounts.archive(id, true);
    revalidatePath('/app/accounts');
    revalidatePath(`/app/accounts/${id}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('Archive account action error:', err);
    return { success: false, error: 'No se pudo archivar la cuenta' };
  }
}

export async function restoreAccountAction(id: string) {
  try {
    await api.accounts.restore(id, true);
    revalidatePath('/app/accounts');
    revalidatePath(`/app/accounts/${id}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('Restore account action error:', err);
    return { success: false, error: 'No se pudo restaurar la cuenta' };
  }
}

export async function adjustBalanceAction(id: string, data: { target_balance: string | number; reason: string; idempotency_key: string }) {
  try {
    await api.accounts.adjustBalance(id, {
      target_balance: data.target_balance,
      reason: data.reason,
      idempotency_key: data.idempotency_key
    }, true);
    revalidatePath('/app/accounts');
    revalidatePath(`/app/accounts/${id}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('Adjust balance action error:', err);
    let message = 'No pudimos ajustar el saldo.';
    const apiError = err as { status?: number; message?: string };
    if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado') {
      message = apiError.message;
    }
    return { success: false, error: message };
  }
}

export async function getAccountScreenDataAction(id: string, targetMonth: string) {
  try {
    const [account, movements, summary] = await Promise.all([
      api.accounts.get(id, true),
      api.accounts.getMovements(id, { limit: 50 }, true).catch(() => null),
      api.accounts.getPeriodSummary(id, targetMonth, true).catch(() => null)
    ]);
    
    return {
      success: true,
      data: { account, movements, summary }
    };
  } catch (err: unknown) {
    console.error('getAccountScreenDataAction error:', err);
    return { success: false, error: 'No se pudo cargar la información de la cuenta' };
  }
}

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

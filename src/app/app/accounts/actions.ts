'use server';

import { api } from '@/lib/api/endpoints';
import { components } from '@/lib/api/types.generated';
import { revalidatePath } from 'next/cache';

export async function createAccountAction(data: {
  name: string;
  type: string;
  currency: string;
}) {
  try {
    const account = await api.accounts.create({
      name: data.name,
      type: data.type as components['schemas']['AccountType'],
      currency: data.currency
    }, true);
    
    revalidatePath('/app/accounts');
    return { success: true, account };
  } catch (err: unknown) {
    console.error('Create account action error:', err);
    let message = 'Ocurrió un error al crear la cuenta. Intenta nuevamente.';
    if (err instanceof Error) {
      if (err.message.includes('409')) message = 'Ya existe una cuenta con este nombre.';
      else if (err.message.includes('422')) message = 'Los datos ingresados no son válidos.';
    }
    return { success: false, error: message };
  }
}

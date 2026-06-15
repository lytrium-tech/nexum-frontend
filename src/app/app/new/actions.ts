'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function createEntryAction(data: {
  type: 'income' | 'expense';
  accountId: string;
  amount: number;
  categoryId?: string;
  description?: string;
}) {
  try {
    const idempotencyKey = crypto.randomUUID();
    const payload = {
      account_id: data.accountId,
      amount: data.amount,
      category_id: data.categoryId || null,
      description: data.description || null,
      source: 'manual' as const
    };

    let result;
    if (data.type === 'income') {
      result = await api.cash.createIncome(payload, idempotencyKey, true);
    } else {
      result = await api.cash.createExpense(payload, idempotencyKey, true);
    }
    
    // Refresh ledger history and dashboard
    revalidatePath('/app/history');
    revalidatePath('/app');
    
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Create entry action error:', err);
    let message = 'Ocurrió un error al registrar el movimiento. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string };
    if (apiError?.status === 422) {
      message = 'Los datos ingresados no son válidos.';
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado') {
      message = apiError.message;
    }
    
    return { success: false, error: message };
  }
}

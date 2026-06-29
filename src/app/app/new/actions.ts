'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { handleFinancialError } from '@/lib/api/errors';

export async function createEntryAction(data: {
  type: 'income' | 'expense';
  accountId: string;
  amount: number;
  currency: string;
  categoryId?: string;
  description?: string;
}) {
  try {
    const idempotencyKey = crypto.randomUUID();
    const payload = {
      account_id: data.accountId,
      amount: data.amount,
      currency: data.currency,
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
    return { success: false, error: handleFinancialError(err, 'Ocurrió un error al registrar el movimiento. Intenta nuevamente.') };
  }
}

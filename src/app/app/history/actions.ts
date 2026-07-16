'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import { components } from '@/lib/api/types.generated';

export async function reclassifyEventAction(
  eventId: string,
  data: components['schemas']['ReclassificationRequest']
) {
  try {
    const result = await api.ledger.reclassifyEvent(eventId, data, true);
    
    // Revalidate paths that may display ledger events and category aggregations
    revalidatePath('/app/history');
    revalidatePath('/app'); // dashboard
    
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Reclassify event error:', err);
    let message = 'No pudimos cambiar la categoría. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string; data?: unknown };
    
    if (apiError?.status === 401) {
      message = 'Tu sesión expiró. Vuelve a iniciar sesión.';
    } else if (apiError?.status === 403) {
      message = 'No puedes modificar este movimiento o esta categoría.';
    } else if (apiError?.status === 404) {
      message = 'El movimiento o la categoría ya no están disponibles.';
    } else if (apiError?.status === 409) {
      message = apiError.message || 'Error de conflicto en la operación.';
    } else if (apiError?.status === 422) {
      message = 'Revisa la categoría seleccionada y el motivo.';
    }
    
    return { success: false, error: message };
  }
}

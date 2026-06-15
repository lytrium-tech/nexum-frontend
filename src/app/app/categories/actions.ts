'use server';

import { api } from '@/lib/api/endpoints';
import { revalidatePath } from 'next/cache';
import { components } from '@/lib/api/types.generated';

export async function createCategoryAction(data: components['schemas']['CategoryCreate']) {
  try {
    const result = await api.categories.create(data, true);
    revalidatePath('/app/categories');
    revalidatePath('/app/new');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Create category error:', err);
    let message = 'Ocurrió un error al crear la categoría. Intenta nuevamente.';
    
    const apiError = err as { status?: number; message?: string };
    if (apiError?.status === 409) {
      message = 'Ya existe una categoría con este nombre.';
    } else if (apiError?.status === 422) {
      message = 'Los datos ingresados no son válidos.';
    } else if (apiError?.message && apiError.message !== 'Ocurrió un error inesperado') {
      message = apiError.message;
    }
    
    return { success: false, error: message };
  }
}

export async function updateCategoryAction(id: string, data: components['schemas']['CategoryUpdate']) {
  try {
    const result = await api.categories.update(id, data, true);
    revalidatePath('/app/categories');
    revalidatePath('/app/new');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('Update category error:', err);
    let message = 'Ocurrió un error al actualizar la categoría. Intenta nuevamente.';
    const apiError = err as { status?: number; message?: string; data?: unknown };
    console.error('Update category apiError details:', { status: apiError?.status, message: apiError?.message, data: apiError?.data });
    
    if (apiError?.status === 409) {
      message = 'Ya existe una categoría con este nombre.';
    } else if (apiError?.status === 422) {
      message = 'Los datos ingresados no son válidos.';
      if (apiError.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
        message = apiError.message;
      }
    } else if (apiError?.message && typeof apiError.message === 'string' && apiError.message !== 'Ocurrió un error inesperado' && apiError.message !== '{}') {
      message = apiError.message;
    }

    if (message === '{}' || message === 'Ocurrió un error al actualizar la categoría. Intenta nuevamente.') {
      message = 'No pude reactivar esta categoría. Intenta nuevamente.';
    }
    
    return { success: false, error: message };
  }
}



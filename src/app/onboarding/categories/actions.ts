'use server'

import { redirect } from 'next/navigation'
import { api } from '@/lib/api/endpoints'
import type { components } from '@/lib/api/types.generated'

type CategoryType = components['schemas']['CategoryType']

const categoryTypeMap: Record<string, CategoryType> = {
  'Alimentación': 'expense',
  'Transporte': 'expense',
  'Vivienda': 'expense',
  'Servicios': 'expense',
  'Salud': 'expense',
  'Educación': 'expense',
  'Entretenimiento': 'expense',
  'Compras': 'expense',
  'Ingresos': 'income',
  'Otros': 'expense'
};

export async function createCategories(formData: FormData) {
  const selectedCategories = formData.getAll('category') as string[]
  const customCategory = formData.get('custom_category') as string

  const categoriesToCreate = [...selectedCategories]
  if (customCategory && customCategory.trim() !== '') {
    categoriesToCreate.push(customCategory.trim())
  }

  if (categoriesToCreate.length === 0) {
    redirect('/onboarding/categories?error=Selecciona+al+menos+una+categoría')
  }

  let creationError = '';
  try {
    const existingCategories = await api.categories.list(true).catch(() => []);
    const existingNames = new Set(existingCategories.map(c => c.name.toLowerCase()));

    // Create sequentially to avoid overwhelming the server
    for (const name of categoriesToCreate) {
      if (existingNames.has(name.toLowerCase())) {
        continue;
      }
      const type: CategoryType = categoryTypeMap[name] || 'expense';
      try {
        await api.categories.create({ name, type }, true);
      } catch (err: unknown) {
        console.error('Failed to create category:', name, err);
        throw new Error('No se pudieron crear algunas categorías. Por favor, intenta de nuevo.');
      }
    }
  } catch (error: unknown) {
    console.error('Category creation process failed:', error);
    const err = error as Error;
    creationError = err.message || 'Ocurrió un error inesperado al configurar tus categorías.';
  }

  if (creationError) {
    redirect(`/onboarding/categories?error=${encodeURIComponent(creationError)}`);
  }

  redirect('/app')
}

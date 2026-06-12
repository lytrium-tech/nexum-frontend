'use server'

import { redirect } from 'next/navigation'
import { api } from '@/lib/api/endpoints'
import type { components } from '@/lib/api/types.generated'

type CategoryType = components['schemas']['CategoryType']

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

  try {
    await Promise.all(categoriesToCreate.map(name => {
      // Basic heuristic: if it's "Ingresos" we map it to "income", otherwise "expense"
      const type: CategoryType = name.toLowerCase().includes('ingreso') ? 'income' : 'expense'
      return api.categories.create({ name, type }, true)
    }))
  } catch (error) {
    console.error('Failed to create categories:', error)
    redirect('/onboarding/categories?error=No+se+pudieron+crear+las+categorías')
  }

  redirect('/app')
}

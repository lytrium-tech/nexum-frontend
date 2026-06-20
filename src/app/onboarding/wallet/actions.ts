'use server'

import { redirect } from 'next/navigation'
import { api } from '@/lib/api/endpoints'
import type { components } from '@/lib/api/types.generated'

type AccountType = components['schemas']['AccountType']

export async function createFirstAccount(formData: FormData) {
  const name = formData.get('name') as string
  const type = formData.get('type') as AccountType
  const currency = formData.get('currency') as string || 'COP'
  const initial_balance_str = formData.get('initial_balance') as string
  const initial_balance = initial_balance_str ? parseFloat(initial_balance_str) : 0

  let creationError = '';
  try {
    await api.accounts.create({
      name,
      type,
      currency,
      initial_balance,
    }, true)
  } catch (error: unknown) {
    const err = error as { status?: number, data?: { detail?: string } };
    if (err.status === 409) {
      const accounts = await api.accounts.list(true).catch(() => []);
      if (accounts.length === 0) {
        creationError = err.data?.detail || 'Ya existe una cuenta activa con este nombre.';
      }
    } else {
      console.error('Failed to create account:', error)
      creationError = 'Ocurrió un error inesperado al intentar crear tu cuenta.';
    }
  }

  if (creationError) {
    redirect(`/onboarding/wallet?error=${encodeURIComponent(creationError)}`)
  }

  let hasCategories = false
  try {
    const categories = await api.categories.list(true)
    hasCategories = categories.length > 0
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }

  if (hasCategories) {
    redirect('/app')
  } else {
    redirect('/onboarding/categories')
  }
}

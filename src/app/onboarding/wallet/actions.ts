'use server'

import { redirect } from 'next/navigation'
import { api } from '@/lib/api/endpoints'
import type { components } from '@/lib/api/types.generated'

type AccountType = components['schemas']['AccountType']

export async function createFirstAccount(formData: FormData) {
  const name = formData.get('name') as string
  const type = formData.get('type') as AccountType
  const currency = formData.get('currency') as string || 'COP'

  try {
    await api.accounts.create({
      name,
      type,
      currency,
    }, true)
  } catch (error) {
    console.error('Failed to create account:', error)
    redirect('/onboarding/wallet?error=No+se+pudo+crear+la+cuenta')
  }

  redirect('/app')
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=Credenciales+incorrectas')
  }

  revalidatePath('/', 'layout')
  redirect('/app')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  let redirectUrl = '/app';

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    })

    if (error) {
      console.error('Supabase signup error:', error)
      let humanMsg = 'No se pudo crear la cuenta.'
      
      // Map Supabase error messages to human readable Spanish
      if (error.message.includes('already registered') || error.message.includes('already exists') || error.status === 422) {
        humanMsg = 'Este correo electrónico ya está registrado.'
      } else if (error.message.includes('Password should be') || error.message.includes('password')) {
        humanMsg = 'La contraseña no cumple con los requisitos mínimos (mínimo 6 caracteres).'
      } else {
        // Fallback to original translated message or actual message
        humanMsg = error.message
      }
      
      redirectUrl = `/signup?error=${encodeURIComponent(humanMsg)}`
    } else if (data?.user && !data?.session) {
      // User created but no session -> Email confirmation is enabled
      redirectUrl = `/signup?success=${encodeURIComponent('Revisa tu correo para confirmar tu cuenta. (Si es desarrollo local y usas Inbucket, revisa la bandeja local)')}`
    } else {
      revalidatePath('/', 'layout')
    }
  } catch (err: unknown) {
    console.error('Unexpected signup error:', err)
    redirectUrl = `/signup?error=${encodeURIComponent('Error inesperado de red al intentar crear la cuenta.')}`
  }

  redirect(redirectUrl)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

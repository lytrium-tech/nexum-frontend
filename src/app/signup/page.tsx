import { signup } from '../auth-actions'
import Link from 'next/link'

export default async function SignupPage(props: { searchParams?: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-soft-gray">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Crear Cuenta</h1>
          <p className="text-gray-500">Únete a Nexum y toma el control de tus finanzas</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">
            {error}
          </div>
        )}

        <form action={signup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="name">Nombre completo</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Juan Pérez"
              required
              className="px-4 py-2 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-gold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              required
              className="px-4 py-2 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-gold"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="px-4 py-2 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-gold"
            />
          </div>

          <button
            type="submit"
            className="mt-4 bg-graphite-blue text-warm-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Registrarse
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-champagne-gold hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

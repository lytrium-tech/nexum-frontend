import { login } from '../auth-actions'
import Link from 'next/link'

export default function LoginPage() {
  // Using React 19's approach for async props in Next 15+ if needed, 
  // but we can just use simple searchParams if we treat it as any or wait for it.
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-soft-gray">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Bienvenido</h1>
          <p className="text-gray-500">Inicia sesión para continuar a Nexum</p>
        </div>

        <form className="flex flex-col gap-4">
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
              className="px-4 py-2 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-gold"
            />
          </div>

          <button
            formAction={login}
            className="mt-4 bg-graphite-blue text-warm-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href="/signup" className="text-champagne-gold hover:underline font-medium">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

import { logout } from '../auth-actions';

export default function AppPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-sm border border-soft-gray text-center">
        <h1 className="text-3xl font-semibold mb-4">Tu espacio financiero está listo.</h1>
        <p className="text-gray-500 mb-8">
          Bienvenido a Nexum. Muy pronto podrás ver tu dashboard aquí.
        </p>
        <form action={logout}>
          <button className="bg-graphite-blue text-warm-white py-2 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium">
            Cerrar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}

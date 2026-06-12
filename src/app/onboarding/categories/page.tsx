import { createCategories } from './actions'
import { TEMPORARY_ALPHA_CATEGORY_FALLBACK } from '@/lib/constants/fallbacks'

export default function CategoriesOnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-sm border border-soft-gray">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Organiza tus Finanzas</h1>
          <p className="text-gray-500">
            Selecciona las categorías que usas habitualmente. Podrás modificarlas más adelante.
          </p>
        </div>

        <form action={createCategories} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            {TEMPORARY_ALPHA_CATEGORY_FALLBACK.map((category) => (
              <label
                key={category}
                className="flex items-center gap-3 p-3 border border-soft-gray rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  name="category"
                  value={category}
                  defaultChecked
                  className="w-4 h-4 text-graphite-blue rounded focus:ring-champagne-gold"
                />
                <span className="text-sm font-medium text-gray-700">{category}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-1 border-t border-soft-gray pt-4">
            <label className="text-sm font-medium" htmlFor="custom_category">Añadir otra categoría (Opcional)</label>
            <input
              id="custom_category"
              name="custom_category"
              type="text"
              placeholder="Ej. Suscripciones, Mascotas..."
              className="px-4 py-2 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-gold"
            />
          </div>

          <button
            type="submit"
            className="mt-2 bg-graphite-blue text-warm-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Comenzar a usar Nexum
          </button>
        </form>
      </div>
    </div>
  )
}

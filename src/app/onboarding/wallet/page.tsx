import { createFirstAccount } from './actions'

export default function WalletOnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-soft-gray">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Tu Primera Billetera</h1>
          <p className="text-gray-500">Para comenzar, crea tu primera cuenta financiera.</p>
        </div>

        <form action={createFirstAccount} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="name">Nombre de la cuenta</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Efectivo, Banco, etc."
              required
              className="px-4 py-2 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-gold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="type">Tipo de cuenta</label>
            <select
              id="type"
              name="type"
              required
              defaultValue="wallet"
              className="px-4 py-2 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-gold bg-white"
            >
              <option value="cash">Efectivo</option>
              <option value="bank">Banco</option>
              <option value="wallet">Billetera Virtual</option>
              <option value="savings">Ahorros</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="currency">Moneda</label>
            <select
              id="currency"
              name="currency"
              required
              defaultValue="COP"
              className="px-4 py-2 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-gold bg-white"
            >
              <option value="COP">COP - Peso Colombiano</option>
              <option value="USD">USD - Dólar Estadounidense</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-4 bg-graphite-blue text-warm-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  )
}

import { api } from '@/lib/api/endpoints';

export default async function AppPage() {
  let snapshot = null;
  let balance = null;
  let freeMoney = null;
  let cashflow = null;
  let hasError = false;

  try {
    // We can fetch in parallel to speed up the load
    const [snapData, balData, freeData, flowData] = await Promise.all([
      api.intelligence.snapshot(true).catch(() => null),
      api.intelligence.balance(true).catch(() => null),
      api.intelligence.freeMoney(true).catch(() => null),
      api.intelligence.cashflow(true).catch(() => null),
    ]);

    snapshot = snapData;
    balance = balData;
    freeMoney = freeData;
    cashflow = flowData;
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    hasError = true;
  }

  const formatCurrency = (amount: number, currency = 'COP') => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  };

  if (hasError || (!snapshot && !balance)) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-soft-gray text-center">
        <h2 className="text-xl font-medium text-gray-800 mb-2">Temporalmente no disponible</h2>
        <p className="text-gray-500">
          No pudimos cargar tus datos financieros en este momento. Por favor, intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  // Si no hay datos financieros reales aún (empty state)
  // El backend podría devolver balance 0 o listas vacías.
  const totalBalance = balance?.total_balance ?? 0;
  const isCompletelyEmpty = totalBalance === 0 && !cashflow?.income_total && !cashflow?.expense_total;

  if (isCompletelyEmpty) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-soft-gray text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-gray-800 mb-2">Comienza a registrar tus movimientos</h2>
        <p className="text-gray-500 mb-6">
          Tu dashboard tomará vida cuando registres tus primeros ingresos o gastos.
        </p>
        <button className="bg-graphite-blue text-warm-white py-2 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium">
          Añadir Transacción
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Disponible Real */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-soft-gray">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Dinero Disponible</h3>
          <p className="text-3xl font-semibold text-graphite-blue">
            {formatCurrency(totalBalance)}
          </p>
          {balance?.safe_money !== undefined && (
            <p className="text-xs text-gray-400 mt-2">
              Dinero seguro: {formatCurrency(balance.safe_money)}
            </p>
          )}
        </div>

        {/* Dinero Libre */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-soft-gray">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Dinero Libre (Fin de mes)</h3>
          <p className="text-3xl font-semibold text-champagne-gold">
            {formatCurrency(freeMoney?.projected_free_money ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Después de obligaciones y metas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resumen Mensual (Cashflow) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-soft-gray">
          <h3 className="text-base font-medium text-gray-800 mb-4">Resumen Mensual</h3>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">Ingresos</span>
            <span className="text-sm font-medium text-green-600">{formatCurrency(cashflow?.income_total ?? 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Gastos</span>
            <span className="text-sm font-medium text-red-500">{formatCurrency(cashflow?.expense_total ?? 0)}</span>
          </div>
        </div>

        {/* Próximas Obligaciones o Snapshot */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-soft-gray">
          <h3 className="text-base font-medium text-gray-800 mb-4">Obligaciones Pendientes</h3>
          {snapshot?.upcoming_obligations && snapshot.upcoming_obligations.length > 0 ? (
            <div className="space-y-3">
              {snapshot.upcoming_obligations.slice(0, 3).map((obs: { name: string, amount: number }, i: number) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{obs.name}</span>
                  <span className="text-sm font-medium">{formatCurrency(obs.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Todo al día. No tienes obligaciones pendientes pronto.</p>
          )}
        </div>
      </div>
    </div>
  );
}

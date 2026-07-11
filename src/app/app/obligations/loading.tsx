export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8 animate-pulse">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-3"></div>
          <div className="h-4 w-64 bg-gray-100 rounded-md"></div>
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-xl"></div>
      </div>

      <div className="mb-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="h-6 w-40 bg-gray-200 rounded-md mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="h-4 w-32 bg-gray-100 rounded-md mb-2"></div>
            <div className="h-24 w-full bg-gray-50 rounded-xl border border-gray-100"></div>
            <div className="h-24 w-full bg-gray-50 rounded-xl border border-gray-100"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 bg-gray-100 rounded-md mb-2"></div>
            <div className="h-6 w-full bg-gray-50 rounded-md"></div>
            <div className="h-6 w-full bg-gray-50 rounded-md"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-32 bg-gray-100 rounded-md mb-2"></div>
            <div className="h-12 w-full bg-gray-50 rounded-lg"></div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
              <div className="w-full">
                <div className="h-6 w-48 bg-gray-200 rounded-md mb-2"></div>
                <div className="h-4 w-36 bg-gray-100 rounded-md"></div>
              </div>
            </div>
            <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div>
                  <div className="h-3 w-32 bg-gray-200 rounded-md mb-2"></div>
                  <div className="h-4 w-40 bg-gray-200 rounded-md"></div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 h-24"></div>
              </div>
              <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-gray-100">
                <div className="h-10 w-24 bg-gray-200 rounded-xl"></div>
                <div className="h-10 w-24 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DiningPage() {
  const diningList = await prisma.dining.findMany();

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="theme-fixed bg-ocean-900 text-white py-16 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Exquisite Dining</h1>
          <p className="text-lg text-ocean-100 max-w-2xl mx-auto font-light">
            Savor the flavors of Sri Lanka and international cuisines with a breathtaking view of the ocean.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {diningList.length === 0 ? (
          <div className="text-center py-20 text-slate-500">Dining details coming soon!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {diningList.map((dining) => (
              <div key={dining.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="text-sm font-semibold text-ocean-600 uppercase tracking-wider mb-2">{dining.type}</div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">{dining.name}</h3>
                <p className="text-slate-600 mb-6 flex-1 text-sm leading-relaxed">{dining.description}</p>
                <div className="space-y-2 pt-4 border-t border-slate-100 mt-auto text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-700">🕒 Hours:</span> {dining.openingHours}</p>
                  <p><span className="font-semibold text-slate-700">📍 Location:</span> {dining.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

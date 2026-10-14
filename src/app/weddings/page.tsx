import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function WeddingsPage() {
  const weddings = await prisma.weddingPackage.findMany();

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="theme-fixed bg-sand-500 text-white py-16 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Weddings at N34</h1>
          <p className="text-lg text-sand-50 max-w-2xl mx-auto font-light">
            Celebrate your special day with the sound of the ocean waves and a stunning tropical sunset.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {weddings.length === 0 ? (
          <div className="text-center py-20 text-slate-500">Wedding packages coming soon!</div>
        ) : (
          <div className="space-y-8">
            {weddings.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-slate-800 mb-4">{pkg.name}</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">{pkg.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-1">Venue</h4>
                      {pkg.venueDetails}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-1">Dining</h4>
                      {pkg.diningOptions}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg sm:col-span-2">
                      <h4 className="font-semibold text-slate-800 mb-1">Special Features</h4>
                      {pkg.features}
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-auto shrink-0 flex flex-col gap-3">
                  <Link href="/contact?subject=Wedding Inquiry" className="block text-center bg-sand-500 hover:bg-sand-600 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-sm shadow-sand-500/20">
                    Inquire Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


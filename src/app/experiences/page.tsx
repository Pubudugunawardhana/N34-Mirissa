import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ExperiencesPage() {
  const experiences = await prisma.experience.findMany();

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="theme-fixed bg-ocean-900 text-white py-16 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Unforgettable Experiences</h1>
          <p className="text-lg text-ocean-100 max-w-2xl mx-auto font-light">
            Explore Mirissa beyond the beach. Discover whale watching, guided tours, and local adventures.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {experiences.length === 0 ? (
          <div className="text-center py-20 text-slate-500">More experiences coming soon!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {experiences.map((exp) => (
              <div key={exp.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{exp.title}</h3>
                <p className="text-ocean-600 font-medium mb-4">${(exp.price || 0).toFixed(2)} | ⏱️ {exp.duration}</p>
                <p className="text-slate-600 mb-6 flex-1 text-sm leading-relaxed">{exp.description}</p>
                <div className="pt-4 border-t border-slate-100 mt-auto text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">Guide/Contact:</span> {exp.phone}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


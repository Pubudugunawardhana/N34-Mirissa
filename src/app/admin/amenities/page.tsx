import prisma from '@/lib/prisma';
import { deleteFacility, deleteFeature } from '@/app/actions/amenities';
import { FacilityForm, FeatureForm } from '@/components/admin/AmenityForms';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import FacilityIcon, { FACILITY_ICON_NAMES } from '@/components/FacilityIcon';

export const dynamic = 'force-dynamic';

const cardClass = 'bg-white rounded-2xl shadow-sm border border-slate-200';
const countClass = 'rounded-full bg-ocean-50 px-2.5 py-0.5 text-xs font-semibold text-ocean-700';

function usedBy(rooms: number) {
  return `Used by ${rooms} ${rooms === 1 ? 'room' : 'rooms'}`;
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default async function AdminAmenitiesPage() {
  const [features, facilities] = await Promise.all([
    prisma.feature.findMany({ include: { _count: { select: { rooms: true } } }, orderBy: { name: 'asc' } }),
    prisma.facility.findMany({ include: { _count: { select: { rooms: true } } }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Features & Facilities</h1>
        <p className="text-sm text-slate-500 mt-1">The tags you can tick on each room. Guests can filter rooms by facility.</p>
      </div>

      {/* Features */}
      <section className={`${cardClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2.5 text-lg font-semibold text-slate-800">
              Features <span className={countClass}>{features.length}</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500">What the room has, e.g. Bedroom, Balcony, Sofa.</p>
          </div>
          <div className="w-full sm:w-80">
            <FeatureForm />
          </div>
        </div>

        {features.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            No features yet. Add the first one above.
          </p>
        ) : (
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {features.map((feature) => (
              <li
                key={feature.id}
                title={usedBy(feature._count.rooms)}
                className="group flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-1 pl-4 pr-1 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white"
              >
                {feature.name}
                <span className="ml-1 text-xs font-normal text-slate-400">{feature._count.rooms}</span>
                <form action={deleteFeature.bind(null, feature.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`Delete the feature "${feature.name}"? It will be removed from ${feature._count.rooms} ${feature._count.rooms === 1 ? 'room' : 'rooms'}.`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <span className="sr-only">Delete {feature.name}</span>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Facilities */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="border-b border-slate-100 p-6">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-slate-800">
            Facilities <span className={countClass}>{facilities.length}</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">Services in the room, each with an icon and a short description guests will see.</p>
        </div>

        <div className="grid lg:grid-cols-[360px_1fr]">
          <div className="border-b border-slate-100 bg-slate-50/60 p-6 lg:border-b-0 lg:border-r">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-ocean-900">Add a facility</h3>
            <FacilityForm iconNames={FACILITY_ICON_NAMES} />
          </div>

          <div className="p-6">
            {facilities.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center text-sm text-slate-500">
                No facilities yet. Type a name (the icon is picked for you) and a description to create the first one.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {facilities.map((facility) => (
                  <li
                    key={facility.id}
                    className="flex gap-4 rounded-2xl border border-slate-200 p-4 transition-shadow hover:shadow-md hover:shadow-ocean-900/5"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700">
                      <FacilityIcon name={facility.icon} facilityName={facility.name} className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800">{facility.name}</p>
                        <form action={deleteFacility.bind(null, facility.id)}>
                          <ConfirmSubmitButton
                            confirmMessage={`Delete the facility "${facility.name}"? It will be removed from ${facility._count.rooms} ${facility._count.rooms === 1 ? 'room' : 'rooms'}.`}
                            className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <span className="sr-only">Delete {facility.name}</span>
                            <TrashIcon />
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        {facility.description || 'No description.'}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">{usedBy(facility._count.rooms)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

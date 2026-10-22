import prisma from '@/lib/prisma';
import { deleteFacility, deleteFeature } from '@/app/actions/amenities';
import { FacilityForm, FeatureForm } from '@/components/admin/AmenityForms';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import FacilityIcon, { FACILITY_ICON_NAMES } from '@/components/FacilityIcon';

export const dynamic = 'force-dynamic';

type Amenity = { id: string; icon: string | null; name: string; description: string | null; _count: { rooms: number } };

type AmenitySectionProps = {
  title: string;
  hint: string;
  // "feature" or "facility", used in the wording.
  noun: string;
  items: Amenity[];
  form: React.ReactNode;
  deleteAction: (id: string) => Promise<void>;
};

function roomCount(rooms: number) {
  return `${rooms} ${rooms === 1 ? 'room' : 'rooms'}`;
}

// Features and facilities share this layout: the add form on the left, the saved items as cards on the right.
function AmenitySection({ title, hint, noun, items, form, deleteAction }: AmenitySectionProps) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-100 p-6">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-slate-800">
          {title} <span className="rounded-full bg-ocean-50 px-2.5 py-0.5 text-xs font-semibold text-ocean-700">{items.length}</span>
        </h2>
        <p className="mt-1 text-sm text-slate-500">{hint}</p>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr]">
        <div className="border-b border-slate-100 bg-slate-50/60 p-6 lg:border-b-0 lg:border-r">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-ocean-900">Add a {noun}</h3>
          {form}
        </div>

        <div className="p-6">
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center text-sm text-slate-500">
              No {title.toLowerCase()} yet. Type a name (the icon is picked for you) and a description to create the first one.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-slate-200 p-4 transition-shadow hover:shadow-md hover:shadow-ocean-900/5"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700">
                    <FacilityIcon name={item.icon} facilityName={item.name} className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <form action={deleteAction.bind(null, item.id)}>
                        <ConfirmSubmitButton
                          title={`Delete this ${noun}?`}
                          confirmLabel="Delete"
                          cancelLabel="Keep"
                          confirmMessage={`Delete the ${noun} "${item.name}"? It will be removed from ${roomCount(item._count.rooms)}.`}
                          className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <span className="sr-only">Delete {item.name}</span>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.description || 'No description.'}</p>
                    <p className="mt-2 text-xs text-slate-400">Used by {roomCount(item._count.rooms)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
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

      <AmenitySection
        title="Features"
        hint="What the room has, e.g. Bedroom, Balcony, Sofa, each with an icon and a short description guests will see."
        noun="feature"
        items={features}
        form={<FeatureForm iconNames={FACILITY_ICON_NAMES} />}
        deleteAction={deleteFeature}
      />

      <AmenitySection
        title="Facilities"
        hint="Services in the room, each with an icon and a short description guests will see."
        noun="facility"
        items={facilities}
        form={<FacilityForm iconNames={FACILITY_ICON_NAMES} />}
        deleteAction={deleteFacility}
      />
    </div>
  );
}

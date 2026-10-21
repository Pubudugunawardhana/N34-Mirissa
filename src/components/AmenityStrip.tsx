import FacilityIcon from '@/components/FacilityIcon';

// One half of the sliding strip repeats the list until it has at least 10 cards, then the half is doubled.
function loopItems<T>(items: T[]) {
  const half: T[] = [];
  while (half.length < 10) half.push(...items);
  return [...half, ...half];
}

type Amenity = { id: string; name: string; icon: string | null };

type AmenityStripProps = {
  eyebrow: string;
  title: string;
  items: Amenity[];
  section: string;
  reverse?: boolean;
  className?: string;
};

// A heading and a row of square cards that slides sideways on its own (hover pauses it). Used on Home and Rooms.
export default function AmenityStrip({ eyebrow, title, items, section, reverse = false, className = 'pt-24' }: AmenityStripProps) {
  if (items.length === 0) return null;
  return (
    <section className={className} data-amenities={section}>
      <div className="text-center">
        <span className="block text-xs font-medium uppercase tracking-[0.3em] text-sand-600">{eyebrow}</span>
        <h2 className="mt-3 font-display text-3xl font-semibold text-ocean-900 md:text-4xl">{title}</h2>
        <span className="mx-auto mt-4 block h-0.5 w-16 rounded-full bg-sand-500" aria-hidden="true" />
      </div>
      <div className="marquee-group mt-10 overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <ul className={`marquee-track flex w-max gap-5 ${reverse ? 'marquee-reverse' : ''}`}>
          {/* Two identical halves, each long enough to fill a wide screen: when the first half has slid out,
              the second is exactly where it started. */}
          {loopItems(items).map((item, index) => (
            <li
              key={`${item.id}-${index}`}
              aria-hidden={index >= items.length || undefined}
              data-amenity={index < items.length ? item.name : undefined}
              className="group flex h-44 w-48 shrink-0 flex-col items-center justify-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 text-center shadow-md shadow-ocean-900/5 transition-all duration-300 hover:-translate-y-1 hover:border-sand-200 hover:shadow-xl hover:shadow-ocean-900/10"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ocean-50 text-ocean-700 transition-colors duration-300 group-hover:bg-sand-500 group-hover:text-white">
                <FacilityIcon name={item.icon} facilityName={item.name} className="h-9 w-9" />
              </span>
              <span className="text-base font-semibold text-ocean-900">{item.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

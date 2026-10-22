import type { Metadata } from 'next';
import Link from 'next/link';
import Alert from '@/components/auth/Alert';
import FacilityIcon from '@/components/FacilityIcon';
import PhotoSlideshow from '@/components/PhotoSlideshow';
import RoomShowcase from '@/components/rooms/RoomShowcase';
import SelectMenu from '@/components/SelectMenu';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { getBookedCounts } from '@/lib/availability';
import { formatStayDate, todayDateOnly, validateStay } from '@/lib/booking';
import prisma from '@/lib/prisma';
import BookingPausedNotice from '@/components/booking/BookingPausedNotice';
import { getSiteSettings } from '@/lib/hotel';

export const metadata: Metadata = { title: 'Rooms | N34 Mirissa' };

const ADULT_OPTIONS = [
  { value: '', label: 'Any' },
  ...[1, 2, 3, 4, 5, 6].map((count) => ({ value: String(count), label: `${count} ${count === 1 ? 'Adult' : 'Adults'}` })),
];

const SORT_OPTIONS = [
  { value: '', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'size', label: 'Largest first' },
];

const SORT_ORDER = {
  '': { price: 'asc' },
  'price-desc': { price: 'desc' },
  size: { area: 'desc' },
} as const;

const CHILD_OPTIONS = [
  { value: '', label: 'Any' },
  ...[1, 2, 3, 4].map((count) => ({ value: String(count), label: `${count} ${count === 1 ? 'Child' : 'Children'}` })),
];

// Shown in the hero until at least one room has a photo.
const FALLBACK_HERO_SLIDES = ['/images/hero-1.jpg', '/images/hero-2.jpg', '/images/hero-3.jpg'];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function count(value: string | undefined) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 20) : 0;
}

const filterLabelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2.5';
const dateInputClass =
  'w-full h-14 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 outline-none hover:border-slate-300 focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/30 focus:bg-white transition-all';

export default async function PublicRoomsPage({ searchParams }: PageProps<'/rooms'>) {
  const params = await searchParams;

  const checkIn = first(params.checkIn) ?? '';
  const checkOut = first(params.checkOut) ?? '';
  const adults = count(first(params.adults));
  const children = count(first(params.children));
  const facilityIds = [params.facility ?? []].flat();
  const sortParam = first(params.sort) ?? '';
  const sort = sortParam in SORT_ORDER ? (sortParam as keyof typeof SORT_ORDER) : '';

  const hasDates = !!(checkIn || checkOut);
  const stay = hasDates ? validateStay(checkIn, checkOut) : null;

  const [site, rooms, facilities, bookedCounts] = await Promise.all([
    getSiteSettings(),
    prisma.room.findMany({
      where: {
        isActive: true,
        maxAdults: { gte: adults },
        maxChildren: { gte: children },
        AND: facilityIds.map((facilityId) => ({ facilities: { some: { facilityId } } })),
      },
      include: {
        images: { orderBy: { position: 'asc' }, take: 1 },
        facilities: { include: { facility: true } },
      },
      orderBy: SORT_ORDER[sort],
    }),
    prisma.facility.findMany({ orderBy: { name: 'asc' } }),
    stay?.ok ? getBookedCounts(stay.checkIn, stay.checkOut) : null,
  ]);

  // Carries the search into the booking form so the guest does not type it twice.
  const bookingQuery = new URLSearchParams();
  if (stay?.ok) {
    bookingQuery.set('checkIn', checkIn);
    bookingQuery.set('checkOut', checkOut);
  }
  if (adults) bookingQuery.set('adults', String(adults));
  if (children) bookingQuery.set('children', String(children));
  const query = bookingQuery.toString();

  const isFiltered = hasDates || adults > 0 || children > 0 || facilityIds.length > 0;

  const roomsLeftFor = (room: { id: string; quantity: number }) =>
    bookedCounts ? Math.max(0, room.quantity - (bookedCounts.get(room.id) ?? 0)) : null;
  const availableCount = rooms.filter((room) => roomsLeftFor(room) !== 0).length;
  const roomWord = (count: number) => `${count} ${count === 1 ? 'room' : 'rooms'}`;

  const covers = rooms.flatMap((room) => (room.images[0] ? [room.images[0].url] : []));
  const heroSlides = covers.length > 0 ? covers : FALLBACK_HERO_SLIDES;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      {/* Hero */}
      <header className="theme-fixed relative flex h-screen min-h-[640px] items-center justify-center overflow-hidden bg-ocean-900 text-white">
        <PhotoSlideshow slides={heroSlides} sizes="100vw" dotsClassName="bottom-28 left-1/2 -translate-x-1/2" />
        {/* Darkens the photos so the white text stays readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ocean-900/65 via-ocean-900/35 to-ocean-900/70" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 pt-10 text-center">
          <span className="mb-4 block text-xs font-medium uppercase tracking-[0.3em] text-sand-200 sm:text-sm">Stay with us</span>
          <h1 className="font-display text-5xl font-semibold drop-shadow-lg md:text-6xl">Our Rooms</h1>
          <p className="mt-5 font-light text-slate-200">
            {stay?.ok
              ? `Showing availability for ${formatStayDate(stay.checkIn)} to ${formatStayDate(stay.checkOut)} (${stay.nights} ${stay.nights === 1 ? 'night' : 'nights'}).`
              : 'Pick your dates to see which rooms are free, then book in a few clicks.'}
          </p>
        </div>
      </header>

      {/* Availability bar, overlapping the hero */}
      <div id="rooms" className="relative z-20 mx-auto -mt-16 max-w-7xl scroll-mt-28 px-4 sm:px-6 lg:px-8">
        <form action="/rooms" className="rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl shadow-ocean-900/10 md:p-8">
          <div className="grid grid-cols-2 items-end gap-4 lg:grid-cols-[1.1fr_1.1fr_0.9fr_0.9fr_1.3fr_1fr] lg:gap-5">
            <div>
              <label htmlFor="filter-check-in" className={filterLabelClass}>Check-in</label>
              <input id="filter-check-in" type="date" name="checkIn" defaultValue={checkIn} min={todayDateOnly()} className={dateInputClass} />
            </div>
            <div>
              <label htmlFor="filter-check-out" className={filterLabelClass}>Check-out</label>
              <input id="filter-check-out" type="date" name="checkOut" defaultValue={checkOut} min={todayDateOnly()} className={dateInputClass} />
            </div>
            <SelectMenu id="filter-adults" name="adults" label="Adults" options={ADULT_OPTIONS} defaultValue={adults ? String(adults) : ''} />
            <SelectMenu id="filter-children" name="children" label="Children" options={CHILD_OPTIONS} defaultValue={children ? String(children) : ''} />
            <SelectMenu id="filter-sort" name="sort" label="Sort by" options={SORT_OPTIONS} defaultValue={sort} />
            <button className="col-span-2 h-14 rounded-xl bg-ocean-800 px-4 font-semibold text-white shadow-lg shadow-ocean-800/25 transition-all hover:bg-ocean-900 hover:shadow-xl lg:col-span-1">
              Search rooms
            </button>
          </div>

          {(facilities.length > 0 || isFiltered) && (
            <div className="mt-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-t border-slate-100 pt-5">
              {facilities.length > 0 && (
                // Opens by itself when a facility filter is in use.
                <details open={facilityIds.length > 0} className="group min-w-0 flex-1">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-ocean-700 hover:text-ocean-900 [&::-webkit-details-marker]:hidden">
                    More filters
                    {facilityIds.length > 0 && (
                      <span className="rounded-full bg-ocean-600 px-2 py-0.5 text-xs text-white">{facilityIds.length}</span>
                    )}
                    <svg className="h-4 w-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <fieldset className="mt-4">
                    <legend className={filterLabelClass}>Facilities</legend>
                    <div className="flex flex-wrap gap-2">
                      {facilities.map((facility) => (
                        <label key={facility.id} className="relative cursor-pointer">
                          <input
                            type="checkbox"
                            name="facility"
                            value={facility.id}
                            defaultChecked={facilityIds.includes(facility.id)}
                            className="peer sr-only"
                          />
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-ocean-400 peer-checked:border-ocean-600 peer-checked:bg-ocean-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ocean-500/40">
                            <FacilityIcon name={facility.icon} facilityName={facility.name} className="h-4 w-4" />
                            {facility.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </details>
              )}
              {isFiltered && (
                <Link href="/rooms" className="text-sm font-medium text-slate-500 hover:text-ocean-600">
                  Clear filters
                </Link>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Rooms */}
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        {/* Introduction */}
        <section className="mx-auto mb-14 max-w-3xl text-center" data-rooms="intro">
          <span className="block text-xs font-medium uppercase tracking-[0.3em] text-sand-600">Accommodation</span>
          <h2 className="mt-3 font-display text-3xl font-semibold text-ocean-900 md:text-4xl">Serenity Awaits You</h2>
          <span className="mx-auto mt-4 block h-0.5 w-16 rounded-full bg-sand-500" aria-hidden="true" />
          <p className="mt-8 font-light leading-loose text-slate-600">
            Unwind in calm, light-filled rooms just steps from Mirissa beach. Each one blends simple tropical design with modern
            comfort, so you can rest easy, listen to the waves and let the south coast set the pace of your day. Choose the room
            that suits your stay, from cosy rooms for two to space for the whole family.
          </p>
        </section>

        {site.bookingsPaused && (
          <div className="mb-8">
            <BookingPausedNotice site={site} />
          </div>
        )}
        {first(params.unavailable) && (
          <div className="mb-8">
            <Alert variant="info">The room you tried to book is no longer available. Here are the rooms you can book now.</Alert>
          </div>
        )}

        {stay && !stay.ok && (
          <div className="mb-8">
            <Alert>{stay.message}</Alert>
          </div>
        )}

        {rooms.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <p className="font-display text-2xl font-semibold text-ocean-900">No rooms match your search</p>
            <p className="mt-2 text-sm text-slate-500">
              {isFiltered ? 'Try fewer guests or facilities.' : 'Rooms will appear here once the hotel adds them.'}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-10 text-center text-sm text-slate-500">
              <span className="font-semibold text-slate-800">
                {bookedCounts ? `${availableCount} of ${roomWord(rooms.length)}` : roomWord(rooms.length)}
              </span>
              {bookedCounts ? ' available for these dates' : isFiltered ? ' match your search' : ' to choose from'}
            </p>

            <div className="grid gap-x-10 gap-y-20 md:grid-cols-2">
              {rooms.map((room, index) => (
                <div key={room.id} className={index === 0 ? 'md:col-span-2' : undefined}>
                  <RoomShowcase
                    room={room}
                    roomsLeft={roomsLeftFor(room)}
                    bookHref={`/book?roomId=${room.id}${query ? `&${query}` : ''}`}
                    detailsHref={`/rooms/${room.id}${query ? `?${query}` : ''}`}
                    featured={index === 0}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

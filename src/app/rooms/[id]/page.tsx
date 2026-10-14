import Link from 'next/link';
import { notFound } from 'next/navigation';
import FacilityIcon from '@/components/FacilityIcon';
import RoomCover from '@/components/rooms/RoomCover';
import RoomGallery from '@/components/rooms/RoomGallery';
import RoomShowcase from '@/components/rooms/RoomShowcase';
import SelectMenu from '@/components/SelectMenu';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { getBookedCounts } from '@/lib/availability';
import { formatLKR, guestSummary, todayDateOnly, validateStay } from '@/lib/booking';
import prisma from '@/lib/prisma';

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function countOptions(from: number, to: number, singular: string, plural: string) {
  return Array.from({ length: to - from + 1 }, (_, index) => {
    const count = from + index;
    return { value: String(count), label: count === 0 ? `No ${plural.toLowerCase()}` : `${count} ${count === 1 ? singular : plural}` };
  });
}

function clamp(value: string | undefined, min: number, max: number, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
}

const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2.5';
const dateInputClass =
  'w-full h-14 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 outline-none hover:border-slate-300 focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/30 focus:bg-white transition-all';
const eyebrowClass = 'block text-xs font-medium uppercase tracking-[0.3em] text-sand-600';
const sectionTitleClass = 'font-display text-3xl font-semibold text-ocean-900 md:text-4xl';

export default async function RoomDetailsPage({ params, searchParams }: PageProps<'/rooms/[id]'>) {
  const { id } = await params;
  const query = await searchParams;

  const checkIn = first(query.checkIn) ?? '';
  const checkOut = first(query.checkOut) ?? '';
  const stay = checkIn && checkOut ? validateStay(checkIn, checkOut) : null;

  // All fetched together: each query is a long round trip to the database.
  const [room, otherRooms, booked] = await Promise.all([
    prisma.room.findFirst({
      where: { id, isActive: true },
      include: {
        images: { orderBy: { position: 'asc' } },
        features: { include: { feature: true } },
        facilities: { include: { facility: true } },
      },
    }),
    prisma.room.findMany({
      where: { isActive: true, id: { not: id } },
      include: { images: { orderBy: { position: 'asc' }, take: 1 }, facilities: { include: { facility: true } } },
      orderBy: { price: 'asc' },
      take: 3,
    }),
    stay?.ok ? getBookedCounts(stay.checkIn, stay.checkOut) : null,
  ]);
  if (!room) notFound();

  const roomsLeft = booked ? Math.max(0, room.quantity - (booked.get(room.id) ?? 0)) : null;

  const adults = clamp(first(query.adults), 1, room.maxAdults, Math.min(2, room.maxAdults));
  const children = clamp(first(query.children), 0, room.maxChildren, 0);

  // With valid dates the button goes straight to the booking form; otherwise it brings the guest to the date fields.
  const bookNowHref = stay?.ok
    ? `/book?${new URLSearchParams({ roomId: room.id, checkIn, checkOut, adults: String(adults), children: String(children) })}`
    : '#book';

  const facts = [
    { icon: 'bed-double', label: 'Number of units', value: `${room.quantity} ${room.quantity === 1 ? 'room' : 'rooms'}` },
    { icon: 'maximize', label: 'Size', value: `${room.area} sq ft` },
    { icon: 'users', label: 'Sleeps', value: guestSummary(room.maxAdults, room.maxChildren) },
    { icon: 'banknote', label: 'Price', value: `${formatLKR(room.price)} per night` },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      {/* Hero */}
      <header className="theme-fixed relative flex h-screen min-h-[640px] items-center justify-center overflow-hidden bg-ocean-900 text-white">
        <RoomCover src={room.images[0]?.url} alt={room.name} sizes="100vw" priority />
        {/* Darkens the photo so the white text stays readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ocean-900/65 via-ocean-900/30 to-ocean-900/70" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 pt-10 text-center">
          <Link href="/rooms" className="mb-6 inline-block text-sm font-medium text-white/80 transition-colors hover:text-white">
            ← All rooms
          </Link>
          <span className="mb-4 block text-xs font-medium uppercase tracking-[0.3em] text-sand-200 sm:text-sm">Accommodation</span>
          <h1 className="font-display text-5xl font-semibold drop-shadow-lg md:text-6xl">{room.name}</h1>
          <p className="mt-5 font-light text-slate-200">
            From <span className="font-semibold text-white">{formatLKR(room.price)}</span> / night
          </p>
        </div>
      </header>

      {/* Booking bar, overlapping the hero */}
      <div id="book" className="relative z-20 mx-auto -mt-16 max-w-6xl scroll-mt-28 px-4 sm:px-6 lg:px-8">
        <form action="/book" className="rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl shadow-ocean-900/10 md:p-8">
          <input type="hidden" name="roomId" value={room.id} />

          <div className="grid grid-cols-2 items-end gap-4 lg:grid-cols-[1.2fr_1.2fr_1fr_1fr_1.2fr] lg:gap-5">
            <div>
              <label htmlFor="check-in" className={labelClass}>Check-in</label>
              <input id="check-in" type="date" name="checkIn" defaultValue={checkIn} min={todayDateOnly()} className={dateInputClass} />
            </div>
            <div>
              <label htmlFor="check-out" className={labelClass}>Check-out</label>
              <input id="check-out" type="date" name="checkOut" defaultValue={checkOut} min={todayDateOnly()} className={dateInputClass} />
            </div>
            <SelectMenu id="adults" name="adults" label="Adults" options={countOptions(1, room.maxAdults, 'Adult', 'Adults')} defaultValue={String(adults)} />
            <SelectMenu id="children" name="children" label="Children" options={countOptions(0, room.maxChildren, 'Child', 'Children')} defaultValue={String(children)} />
            <button className="col-span-2 h-14 rounded-xl bg-sand-500 px-4 font-semibold text-white shadow-lg shadow-sand-500/25 transition-colors hover:bg-sand-600 lg:col-span-1">
              Book this room
            </button>
          </div>

          {(stay || roomsLeft !== null) && (
            <div className="mt-5 border-t border-slate-100 pt-4 text-sm font-medium" aria-live="polite">
              {stay && !stay.ok && <p className="text-red-600">{stay.message}</p>}
              {roomsLeft !== null && (
                <p className={roomsLeft > 0 ? 'text-emerald-700' : 'text-red-600'}>
                  {roomsLeft > 0
                    ? `${roomsLeft} ${roomsLeft === 1 ? 'room' : 'rooms'} left for these dates`
                    : 'Sold out for these dates. Try different dates.'}
                </p>
              )}
            </div>
          )}
        </form>
      </div>

      <main>
        {/* Introduction and key facts */}
        <section className="mx-auto max-w-6xl px-4 pt-20 text-center sm:px-6 lg:px-8">
          <span className={eyebrowClass}>Accommodation</span>
          <h2 className={`mt-3 ${sectionTitleClass}`}>{room.name}</h2>
          <span className="mx-auto mt-4 block h-0.5 w-16 rounded-full bg-sand-500" aria-hidden="true" />

          {room.description && (
            <p className="mx-auto mt-8 max-w-3xl whitespace-pre-line leading-loose text-slate-600">{room.description}</p>
          )}

          <dl className="mt-14 grid gap-x-8 gap-y-10 text-left sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sand-50 text-sand-600 ring-1 ring-sand-200">
                  <FacilityIcon name={fact.icon} className="h-6 w-6" />
                </span>
                <div>
                  <dt className="text-sm font-semibold text-ocean-900">{fact.label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-600">{fact.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <Link
            href={bookNowHref}
            className="mt-14 inline-block rounded-full bg-sand-500 px-10 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-sand-500/25 transition-colors hover:bg-sand-600"
          >
            Book Now
          </Link>
        </section>

        {/* Photos */}
        {room.images.length > 1 && (
          <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
            <RoomGallery images={room.images.map((image) => image.url)} roomName={room.name} />
          </section>
        )}

        {/* Amenities */}
        {(room.facilities.length > 0 || room.features.length > 0) && (
          <section className="mx-auto grid max-w-7xl gap-12 px-4 pt-24 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8">
            {room.facilities.length > 0 && (
              <div className="rounded-3xl bg-sand-50 p-8 ring-1 ring-sand-200/70 sm:p-10">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-ocean-900">Facilities</h2>
                <ul className="divide-y divide-sand-200">
                  {room.facilities.map(({ facility }) => (
                    <li key={facility.id} className="flex items-center gap-5 py-5">
                      <FacilityIcon name={facility.icon} facilityName={facility.name} className="h-8 w-8 shrink-0 text-sand-600" />
                      <div>
                        <p className="font-medium text-ocean-900">{facility.name}</p>
                        {facility.description && <p className="mt-0.5 text-sm text-slate-600">{facility.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {room.features.length > 0 && (
              <div className="lg:py-4">
                <span className={eyebrowClass}>In this room</span>
                <h2 className={`mt-3 ${sectionTitleClass}`}>Features</h2>
                <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                  {room.features.map(({ feature }) => (
                    <li key={feature.id} className="flex gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700">
                        <FacilityIcon name={feature.icon} facilityName={feature.name} />
                      </span>
                      <div>
                        <p className="font-medium text-ocean-900">{feature.name}</p>
                        {feature.description && <p className="mt-1 text-sm leading-relaxed text-slate-500">{feature.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Other rooms */}
        {otherRooms.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <span className={eyebrowClass}>Keep looking</span>
              <h2 className={`mt-3 ${sectionTitleClass}`}>Explore More Rooms</h2>
            </div>
            <div className={`grid gap-x-8 gap-y-16 md:grid-cols-2 ${otherRooms.length > 2 ? 'lg:grid-cols-3' : 'mx-auto max-w-5xl'}`}>
              {otherRooms.map((other) => (
                <RoomShowcase
                  key={other.id}
                  room={other}
                  roomsLeft={null}
                  bookHref={`/book?roomId=${other.id}`}
                  detailsHref={`/rooms/${other.id}`}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

import Link from 'next/link';
import FacilityIcon from '@/components/FacilityIcon';
import { formatLKR, guestSummary } from '@/lib/booking';
import RoomCover from './RoomCover';

type RoomShowcaseProps = {
  room: {
    name: string;
    description: string | null;
    price: number;
    area: number;
    quantity: number;
    maxAdults: number;
    maxChildren: number;
    images: { url: string }[];
    facilities: { facility: { id: string; icon: string | null; name: string } }[];
  };
  // Units still free for the chosen dates, or null when no dates are chosen.
  roomsLeft: number | null;
  bookHref: string;
  detailsHref: string;
  // The first room on the page: wide photo with the card overlapping its side.
  featured?: boolean;
};

const MAX_FACILITY_ICONS = 6;

function AvailabilityBadge({ roomsLeft }: { roomsLeft: number | null }) {
  if (roomsLeft === null) return null;

  const soldOut = roomsLeft === 0;
  return (
    <span
      className={`absolute left-5 top-5 z-10 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm backdrop-blur ${
        soldOut ? 'bg-red-600/90 text-white' : 'bg-white/90 text-emerald-700'
      }`}
    >
      {soldOut ? 'Sold out for these dates' : `${roomsLeft} ${roomsLeft === 1 ? 'room' : 'rooms'} left`}
    </span>
  );
}

function RoomInfo({ room, roomsLeft, bookHref, detailsHref }: RoomShowcaseProps) {
  const soldOut = roomsLeft === 0;
  const facilities = room.facilities.slice(0, MAX_FACILITY_ICONS);
  const moreFacilities = room.facilities.length - facilities.length;

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="font-display text-2xl font-semibold text-ocean-900">
        <Link href={detailsHref} className="transition-colors hover:text-ocean-600">{room.name}</Link>
      </h2>
      <span className="mt-3 h-0.5 w-16 rounded-full bg-sand-500" aria-hidden="true" />

      {room.description && (
        <p className="mt-5 line-clamp-2 max-w-md text-sm leading-relaxed text-slate-600">{room.description}</p>
      )}

      <ul className="mt-5 flex flex-wrap items-center justify-center gap-y-1 text-sm text-slate-700">
        {[
          `${room.quantity} ${room.quantity === 1 ? 'room' : 'rooms'}`,
          guestSummary(room.maxAdults, room.maxChildren),
          `${room.area} sq ft`,
        ].map((fact, index) => (
          <li key={fact} className={`px-3.5 ${index > 0 ? 'border-l border-slate-300' : ''}`}>{fact}</li>
        ))}
      </ul>

      {facilities.length > 0 && (
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Facilities">
          {facilities.map(({ facility }) => (
            <li
              key={facility.id}
              title={facility.name}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean-50 text-ocean-700"
            >
              <FacilityIcon name={facility.icon} facilityName={facility.name} className="h-4 w-4" />
              <span className="sr-only">{facility.name}</span>
            </li>
          ))}
          {moreFacilities > 0 && (
            <li className="flex h-9 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-600">
              +{moreFacilities} more
            </li>
          )}
        </ul>
      )}

      <p className="mt-6">
        <span className="font-display text-2xl font-semibold text-ocean-900">{formatLKR(room.price)}</span>
        <span className="text-sm text-slate-500"> / night</span>
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
        <Link
          href={detailsHref}
          className="border-b-2 border-ocean-900 pb-1 text-xs font-semibold uppercase tracking-[0.15em] text-ocean-900 transition-colors hover:border-ocean-600 hover:text-ocean-600"
        >
          More details
        </Link>
        {soldOut ? (
          <span className="rounded-full bg-slate-100 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            Sold out
          </span>
        ) : (
          <Link
            href={bookHref}
            className="rounded-full bg-sand-500 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-sand-500/25 transition-colors hover:bg-sand-600"
          >
            Book Now
          </Link>
        )}
      </div>
    </div>
  );
}

// A room as a large photo with a white card overlapping it: beside the photo when featured, below it otherwise.
export default function RoomShowcase(props: RoomShowcaseProps) {
  const { room, roomsLeft, detailsHref, featured } = props;

  if (featured) {
    return (
      <article className="lg:grid lg:grid-cols-12 lg:items-center">
        <Link
          href={detailsHref}
          className="relative block aspect-[16/11] overflow-hidden rounded-3xl bg-slate-200 shadow-sm lg:col-span-8 lg:col-start-1 lg:row-start-1"
        >
          <RoomCover src={room.images[0]?.url} alt={room.name} sizes="(min-width: 1024px) 60vw, 100vw" priority />
          <AvailabilityBadge roomsLeft={roomsLeft} />
        </Link>

        <div className="relative z-10 -mt-12 px-4 sm:px-10 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mt-0 lg:px-0">
          {/* Soft block set off behind the card, as a quieter stand-in for a drop shadow. */}
          <div className="absolute inset-0 hidden translate-x-5 translate-y-5 rounded-3xl bg-sand-200/60 lg:block" aria-hidden="true" />
          <div className="relative rounded-3xl bg-white p-8 shadow-xl shadow-ocean-900/10 sm:p-10">
            <RoomInfo {...props} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article>
      <Link href={detailsHref} className="relative block aspect-[4/3] overflow-hidden rounded-3xl bg-slate-200 shadow-sm">
        <RoomCover src={room.images[0]?.url} alt={room.name} sizes="(min-width: 768px) 50vw, 100vw" />
        <AvailabilityBadge roomsLeft={roomsLeft} />
      </Link>

      <div className="relative z-10 -mt-12 px-4 sm:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-ocean-900/10">
          <RoomInfo {...props} />
        </div>
      </div>
    </article>
  );
}

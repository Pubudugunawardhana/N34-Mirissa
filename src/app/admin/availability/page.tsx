import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BookingStatusBadge } from '@/components/StatusBadge';
import { firstParam } from '@/lib/admin-bookings';
import { addDays, formatStayDate, nightsBetween, parseDateOnly, todayDateOnly } from '@/lib/booking';
import prisma from '@/lib/prisma';
import { getOccupancy, type OccupyingBooking } from '@/lib/room-occupancy';

export const metadata: Metadata = { title: 'Room availability | N34 Admin' };

const MAX_RANGE_NIGHTS = 60;

const quietButton =
  'inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700';
const dateInput =
  'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20';

// The nights to show, from ?from=&to= (check-in and check-out days). Anything unreadable falls back to tonight.
function readRange(fromValue: string | undefined, toValue: string | undefined) {
  const today = todayDateOnly();
  const from = parseDateOnly(fromValue) ? fromValue! : today;
  let to = parseDateOnly(toValue) && toValue! > from ? toValue! : addDays(from, 1);
  if (nightsBetween(parseDateOnly(from)!, parseDateOnly(to)!) > MAX_RANGE_NIGHTS) to = addDays(from, MAX_RANGE_NIGHTS);
  return { from, to };
}

function rangeHref(from: string, to: string) {
  return `/admin/availability?${new URLSearchParams({ from, to })}`;
}

function guestLabel(booking: OccupyingBooking) {
  return booking.guestName || 'Guest';
}

function stayLabel(booking: OccupyingBooking) {
  return `${formatStayDate(booking.checkIn)} → ${formatStayDate(booking.checkOut)}`;
}

export default async function AdminAvailability({ searchParams }: PageProps<'/admin/availability'>) {
  const params = await searchParams;
  const { from, to } = readRange(firstParam(params.from), firstParam(params.to));
  const checkIn = parseDateOnly(from)!;
  const checkOut = parseDateOnly(to)!;
  const nights = nightsBetween(checkIn, checkOut);

  const rooms = await prisma.room.findMany({
    include: { images: { orderBy: { position: 'asc' }, take: 1 } },
    orderBy: [{ isActive: 'desc' }, { price: 'asc' }],
  });
  const occupancy = await getOccupancy(rooms.map((room) => room.id), checkIn, checkOut);

  const cards = rooms.map((room) => {
    const { taken, unassigned } = occupancy.get(room.id)!;
    // Numbers given out before the room type had its list (typed by hand), still holding a room.
    const offList = [...taken.values()].filter((booking) => !room.roomNumbers.includes(booking.roomNumber!));
    const onListTaken = room.roomNumbers.filter((number) => taken.has(number)).length;
    const booked = onListTaken + offList.length + unassigned.length;
    return { room, taken, unassigned, offList, booked, free: Math.max(0, room.quantity - booked) };
  });

  const totals = cards.reduce(
    (sum, card) => ({
      rooms: sum.rooms + card.room.quantity,
      booked: sum.booked + card.booked,
      free: sum.free + card.free,
      waiting: sum.waiting + card.unassigned.length,
    }),
    { rooms: 0, booked: 0, free: 0, waiting: 0 },
  );

  const today = todayDateOnly();
  const shortcuts = [
    { label: 'Tonight', from: today, to: addDays(today, 1) },
    { label: 'Tomorrow', from: addDays(today, 1), to: addDays(today, 2) },
    { label: 'Next 7 days', from: today, to: addDays(today, 7) },
  ];

  const summary = [
    { label: 'Rooms', value: totals.rooms, hint: 'All room types, including hidden ones' },
    { label: 'Booked', value: totals.booked, hint: 'Held for at least one of these nights' },
    { label: 'Free', value: totals.free, hint: 'Free for every night shown', accent: 'text-emerald-600' },
    { label: 'Waiting for a room', value: totals.waiting, hint: 'Booked, but no room number yet', href: totals.waiting > 0 ? '/admin/bookings' : undefined },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Room availability</h1>
        <p className="mt-1 text-sm text-slate-500">Which rooms are booked and which are free for the nights you choose.</p>
      </div>

      {/* Dates */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form action="/admin/availability" className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Check-in</span>
            <input type="date" name="from" defaultValue={from} required className={dateInput} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Check-out</span>
            <input type="date" name="to" defaultValue={to} required className={dateInput} />
          </label>
          <button className="inline-flex h-10 items-center justify-center rounded-lg bg-ocean-600 px-4 text-sm font-semibold text-white shadow-sm shadow-ocean-600/20 transition-colors hover:bg-ocean-700">
            Show
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {shortcuts.map((shortcut) => {
            const active = shortcut.from === from && shortcut.to === to;
            return (
              <Link
                key={shortcut.label}
                href={rangeHref(shortcut.from, shortcut.to)}
                aria-current={active ? 'true' : undefined}
                className={active ? `${quietButton} border-ocean-600 bg-ocean-50 text-ocean-700` : quietButton}
              >
                {shortcut.label}
              </Link>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-700">{formatStayDate(checkIn)} → {formatStayDate(checkOut)}</span> · {nights}{' '}
        {nights === 1 ? 'night' : 'nights'}
      </p>

      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => {
          const body = (
            <>
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className={`mt-1 text-3xl font-bold ${item.accent ?? 'text-slate-800'}`}>{item.value}</p>
              <p className="mt-1 text-xs text-slate-400">{item.hint}</p>
            </>
          );
          const tile = 'block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
          return item.href ? (
            <Link key={item.label} href={item.href} className={`${tile} transition-colors hover:border-ocean-400`}>
              {body}
            </Link>
          ) : (
            <div key={item.label} className={tile}>
              {body}
            </div>
          );
        })}
      </div>

      {/* One card per room type */}
      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
          No rooms yet.{' '}
          <Link href="/admin/rooms/new" className="font-medium text-ocean-600 hover:underline">
            Add a room
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-5">
          {cards.map(({ room, taken, unassigned, offList, booked, free }) => (
            <section key={room.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Room type */}
              <header className="flex flex-wrap items-center gap-4 border-b border-slate-100 p-5">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {room.images[0] && <Image src={room.images[0].url} alt="" fill sizes="80px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-800">{room.name}</h2>
                    {!room.isActive && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Hidden from guests</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {room.quantity} {room.quantity === 1 ? 'room' : 'rooms'}
                    {room.roomNumbers.length === 0 && ' · no room numbers set'}
                  </p>
                </div>
                <div className="w-full sm:w-56">
                  <p className="text-right text-sm text-slate-500">
                    <span className={`font-semibold ${free > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {free} of {room.quantity}
                    </span>{' '}
                    free
                  </p>
                  {/* Share of the rooms already booked */}
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-sand-500"
                      style={{ width: `${room.quantity > 0 ? Math.min(100, (booked / room.quantity) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </header>

              <div className="space-y-4 p-5">
                {room.roomNumbers.length > 0 ? (
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {room.roomNumbers.map((number) => {
                      const booking = taken.get(number);
                      if (!booking) {
                        return (
                          <li
                            key={number}
                            data-room-free={number}
                            className="flex min-h-24 items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                          >
                            <span className="text-lg font-semibold text-slate-800">{number}</span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                              Free
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={number} data-room-booked={number}>
                          <Link
                            href={`/admin/bookings/records?q=${encodeURIComponent(booking.reference)}`}
                            title="Open this booking"
                            className="flex min-h-24 flex-col justify-between gap-1 rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 transition-colors hover:border-sand-500"
                          >
                            <span className="flex items-start justify-between gap-2">
                              <span className="text-lg font-semibold text-slate-800">{number}</span>
                              <BookingStatusBadge status={booking.bookingStatus} />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-slate-800">{guestLabel(booking)}</span>
                              <span className="block truncate text-xs text-slate-500">
                                <span className="font-mono">{booking.reference}</span> · {stayLabel(booking)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{booked}</span> of {room.quantity} booked for these nights.{' '}
                    <Link href={`/admin/rooms/${room.id}/edit`} className="font-medium text-ocean-600 hover:underline">
                      Add room numbers
                    </Link>{' '}
                    to see each room on its own.
                  </p>
                )}

                {/* Bookings holding a room of this type without one of its listed numbers */}
                {(unassigned.length > 0 || offList.length > 0) && (
                  <div className="rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-inset ring-amber-200">
                    <p className="text-sm font-medium text-amber-700">
                      {unassigned.length > 0
                        ? `${unassigned.length} ${unassigned.length === 1 ? 'booking is' : 'bookings are'} waiting for a room number`
                        : 'Booked under a room number that is not in this list'}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {[...unassigned, ...offList].map((booking) => (
                        <li key={booking.id} className="text-sm text-amber-700">
                          <Link
                            href={
                              booking.roomNumber
                                ? `/admin/bookings/records?q=${encodeURIComponent(booking.reference)}`
                                : `/admin/bookings?q=${encodeURIComponent(booking.reference)}`
                            }
                            className="hover:underline"
                          >
                            <span className="font-mono font-semibold">{booking.reference}</span> · {guestLabel(booking)} · {stayLabel(booking)}
                            {booking.roomNumber && ` · room ${booking.roomNumber}`}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

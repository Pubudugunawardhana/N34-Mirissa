import prisma from '@/lib/prisma';
import Link from 'next/link';
import { BookingStatusBadge } from '@/components/StatusBadge';
import { addDays, formatLKR, formatStayDate, nightsBetween, parseDateOnly, todayDateOnly } from '@/lib/booking';

export const dynamic = 'force-dynamic';

const RANGES = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'custom', label: 'Custom' },
] as const;

type RangeKey = (typeof RANGES)[number]['key'];

// Days are counted in hotel time (Sri Lanka, UTC+05:30).
function startOfDay(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00+05:30`);
}

function formatDay(dateOnly: string) {
  const date = parseDateOnly(dateOnly);
  return date ? date.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : dateOnly;
}

// Works out the first and last day (inclusive) of the chosen range. `null` means no limit.
function resolveRange(range: RangeKey, fromParam: string | undefined, toParam: string | undefined) {
  const today = todayDateOnly();

  if (range === 'today') return { from: today, to: today, caption: 'Today' };

  if (range === 'week') {
    // Weeks start on Monday.
    const daysSinceMonday = ((parseDateOnly(today)?.getUTCDay() ?? 1) + 6) % 7;
    return { from: addDays(today, -daysSinceMonday), to: today, caption: 'This week' };
  }

  if (range === 'month') return { from: `${today.slice(0, 8)}01`, to: today, caption: 'This month' };

  if (range === 'custom') {
    // Defaults to this month until the admin picks dates; a reversed pair is swapped rather than rejected.
    let from = parseDateOnly(fromParam) ? (fromParam as string) : `${today.slice(0, 8)}01`;
    let to = parseDateOnly(toParam) ? (toParam as string) : today;
    if (from > to) [from, to] = [to, from];
    return { from, to, caption: from === to ? formatDay(from) : `${formatDay(from)} to ${formatDay(to)}` };
  }

  return { from: null, to: null, caption: 'All time' };
}

const dateInputClass =
  'h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20';

export default async function AdminDashboard({ searchParams }: PageProps<'/admin'>) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const range = RANGES.find((item) => item.key === first(params.range))?.key ?? 'all';
  const { from, to, caption } = resolveRange(range, first(params.from), first(params.to));

  const createdAt = from && to ? { gte: startOfDay(from), lt: startOfDay(addDays(to, 1)) } : undefined;

  const [totalBookings, totalRooms, totalUsers, totalMessages, recentBookings] = await Promise.all([
    prisma.booking.count({ where: { createdAt } }),
    prisma.room.count(),
    prisma.user.count({ where: { createdAt } }),
    prisma.contactMessage.count({ where: { createdAt } }),
    prisma.booking.findMany({ where: { createdAt }, include: { room: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  const stats = [
    { title: range === 'all' ? 'Total Bookings' : 'Bookings', value: totalBookings, caption },
    { title: 'Total Rooms', value: totalRooms, caption: 'All room types' },
    { title: range === 'all' ? 'Registered Users' : 'New Users', value: totalUsers, caption },
    { title: 'New Inquiries', value: totalMessages, caption, href: '/admin/messages?view=unread' },
  ];

  return (
    <div className="space-y-6">
      {/* Time filter */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {range === 'custom' && (
          <form action="/admin" className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-4 pr-1.5 shadow-sm">
            <input type="hidden" name="range" value="custom" />
            <label htmlFor="range-from" className="text-xs font-medium text-slate-500">From</label>
            <input id="range-from" type="date" name="from" defaultValue={from ?? ''} max={todayDateOnly()} className={dateInputClass} />
            <label htmlFor="range-to" className="text-xs font-medium text-slate-500">To</label>
            <input id="range-to" type="date" name="to" defaultValue={to ?? ''} max={todayDateOnly()} className={dateInputClass} />
            <button className="h-9 rounded-full bg-ocean-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-ocean-700">
              Apply
            </button>
          </form>
        )}

        <nav aria-label="Time range" className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {RANGES.map((item) => (
            <Link
              key={item.key}
              href={item.key === 'all' ? '/admin' : `/admin?range=${item.key}`}
              aria-current={item.key === range ? 'true' : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                item.key === range
                  ? 'bg-ocean-600 text-white shadow-sm shadow-ocean-600/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-ocean-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const body = (
            <>
              <h3 className="text-sm font-medium text-slate-500 mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-400">{stat.caption}</p>
            </>
          );
          const tile = 'block bg-white p-6 rounded-xl border border-slate-200 shadow-sm';
          return 'href' in stat && stat.href ? (
            <Link key={stat.title} href={stat.href} className={`${tile} transition-colors hover:border-ocean-400`}>
              {body}
            </Link>
          ) : (
            <div key={stat.title} className={tile}>
              {body}
            </div>
          );
        })}
      </div>

      {/* Recent Bookings: one card each, like the booking records */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Recent Bookings {range !== 'all' && <span className="text-sm font-normal text-slate-400">· {caption}</span>}
          </h2>
          <Link href="/admin/bookings/records?view=all" className="text-sm font-medium text-ocean-600 hover:text-ocean-700">View All</Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            {range === 'all' ? 'No bookings have been made yet.' : 'No bookings were made in this period.'}
          </div>
        ) : (
          <ul className="space-y-4">
            {recentBookings.map((booking) => {
              const nights = nightsBetween(booking.checkIn, booking.checkOut);
              // Waiting bookings are handled on New bookings; the rest live in the records.
              const href =
                booking.bookingStatus === 'PENDING'
                  ? `/admin/bookings?q=${encodeURIComponent(booking.reference)}`
                  : `/admin/bookings/records?view=all&q=${encodeURIComponent(booking.reference)}`;
              return (
                <li key={booking.id}>
                  <Link
                    href={href}
                    className="grid gap-x-6 gap-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-ocean-400 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1.1fr_auto]"
                  >
                    {/* Guest */}
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-ocean-50 px-2 py-1 font-mono text-xs font-semibold tracking-wider text-ocean-700">{booking.reference}</span>
                        {booking.source === 'WALK_IN' ? (
                          <span className="rounded-full bg-sand-50 px-2 py-0.5 text-[11px] font-semibold text-sand-600 ring-1 ring-inset ring-sand-200">Walk-in</span>
                        ) : (
                          !booking.userId && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">No account</span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800">{booking.guestName || 'Guest'}</p>
                      {booking.email && <p className="break-all text-sm text-slate-500">{booking.email}</p>}
                    </div>

                    {/* Room */}
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Room</p>
                      <p className="mt-1 font-semibold text-slate-800">{booking.room.name}</p>
                      <p className="text-sm text-slate-600">{booking.roomNumber ? `Room ${booking.roomNumber}` : 'No room assigned yet'}</p>
                    </div>

                    {/* Stay */}
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Stay</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {formatStayDate(booking.checkIn)} → {formatStayDate(booking.checkOut)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {nights} {nights === 1 ? 'night' : 'nights'} · booked {booking.createdAt.toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' })}
                      </p>
                    </div>

                    {/* Amount and status */}
                    <div className="flex items-center justify-between gap-3 md:col-span-2 xl:col-span-1 xl:w-44 xl:flex-col xl:items-end xl:justify-start">
                      <BookingStatusBadge status={booking.bookingStatus} />
                      <p className="text-lg font-semibold text-ocean-900">{formatLKR(booking.totalAmount)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

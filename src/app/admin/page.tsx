import prisma from '@/lib/prisma';
import Link from 'next/link';
import { BookingStatusBadge } from '@/components/StatusBadge';
import { addDays, formatLKR, formatStayDate, parseDateOnly, todayDateOnly } from '@/lib/booking';

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
    { title: 'New Inquiries', value: totalMessages, caption },
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
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-400">{stat.caption}</p>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Recent Bookings {range !== 'all' && <span className="text-sm font-normal text-slate-400">· {caption}</span>}
          </h2>
          <Link href="/admin/bookings/records" className="text-sm text-ocean-600 font-medium hover:text-ocean-700">View All</Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="p-6">
            <div className="text-center py-10 text-slate-500 text-sm">
              {range === 'all' ? 'No bookings have been made yet.' : 'No bookings were made in this period.'}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentBookings.map((booking) => (
              <li key={booking.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {booking.guestName} · {booking.room.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-mono">{booking.reference}</span> · {formatStayDate(booking.checkIn)} → {formatStayDate(booking.checkOut)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">{formatLKR(booking.totalAmount)}</span>
                  <BookingStatusBadge status={booking.bookingStatus} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

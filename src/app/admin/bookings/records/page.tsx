import type { Prisma } from '@prisma/client';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import BookingList from '@/components/admin/BookingList';
import { BOOKING_SCOPES, firstParam, listBookings } from '@/lib/admin-bookings';
import { parseDateOnly, todayDateOnly } from '@/lib/booking';

export const dynamic = 'force-dynamic';

type View = 'upcoming' | 'past' | 'cancelled' | 'all';

// Bookings still waiting for a room live on the New bookings screen, not here.
// Confirmed stays sort themselves by date: a stay is "upcoming" until its check-out day.
function views(today: Date): { key: View; label: string; where: Prisma.BookingWhereInput; orderBy: Prisma.BookingOrderByWithRelationInput; empty: string }[] {
  return [
    {
      key: 'upcoming',
      label: 'Upcoming',
      where: { bookingStatus: 'CONFIRMED', checkOut: { gt: today } },
      orderBy: { checkIn: 'asc' },
      empty: 'No upcoming stays. Confirmed bookings appear here until the guest’s check-out day.',
    },
    {
      key: 'past',
      label: 'Past stays',
      where: { bookingStatus: 'CONFIRMED', checkOut: { lte: today } },
      orderBy: { checkOut: 'desc' },
      empty: 'No past stays yet.',
    },
    { key: 'cancelled', label: 'Cancelled', where: { bookingStatus: 'CANCELLED' }, orderBy: { createdAt: 'desc' }, empty: 'No cancelled bookings.' },
    { key: 'all', label: 'All', where: BOOKING_SCOPES.records, orderBy: { createdAt: 'desc' }, empty: 'No bookings here yet.' },
  ];
}

export default async function AdminBookingRecords({ searchParams }: PageProps<'/admin/bookings/records'>) {
  const params = await searchParams;
  const today = parseDateOnly(todayDateOnly())!;
  const tabs = views(today);
  const active = tabs.find((tab) => tab.key === firstParam(params.view)) ?? tabs[0];
  const search = firstParam(params.q);

  const [result, ...counts] = await Promise.all([
    listBookings({ where: active.where, search, page: Number(firstParam(params.page)), orderBy: active.orderBy }),
    ...tabs.map((tab) => prisma.booking.count({ where: tab.where })),
  ]);

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-slate-800'>Booking Records</h1>
          <p className='text-sm text-slate-500 mt-1'>Confirmed and cancelled bookings. Upcoming and past stays are sorted by date automatically.</p>
        </div>
        <Link href='/admin/bookings/walk-in' className='inline-flex h-10 items-center gap-1.5 rounded-lg bg-ocean-600 px-4 text-sm font-semibold text-white shadow-sm shadow-ocean-600/20 transition-colors hover:bg-ocean-700'>
          <span aria-hidden='true' className='text-lg leading-none'>+</span> Walk-in booking
        </Link>
      </div>

      <div className='flex flex-wrap gap-2'>
        {tabs.map((tab, index) => {
          const query = new URLSearchParams();
          if (tab.key !== 'upcoming') query.set('view', tab.key);
          if (search) query.set('q', search);
          const text = query.toString();
          return (
            <Link
              key={tab.key}
              href={text ? `/admin/bookings/records?${text}` : '/admin/bookings/records'}
              aria-current={tab.key === active.key ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab.key === active.key
                  ? 'bg-ocean-600 text-white shadow-sm shadow-ocean-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-ocean-600 hover:text-ocean-700'
              }`}
            >
              {tab.label} <span className='opacity-70'>({counts[index]})</span>
            </Link>
          );
        })}
      </div>

      <BookingList
        result={result}
        basePath='/admin/bookings/records'
        keep={active.key === 'upcoming' ? {} : { view: active.key }}
        mode='records'
        emptyText={active.empty}
        emptySearchHint={active.key === 'all' ? undefined : 'It may be under another tab; try All.'}
      />
    </div>
  );
}

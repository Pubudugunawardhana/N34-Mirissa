import type { BookingStatus } from '@prisma/client';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import BookingList from '@/components/admin/BookingList';
import { firstParam, listBookings } from '@/lib/admin-bookings';

export const dynamic = 'force-dynamic';

const FILTERS: { key: BookingStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default async function AdminBookingRecords({ searchParams }: PageProps<'/admin/bookings/records'>) {
  const params = await searchParams;
  const active = FILTERS.find((filter) => filter.key === firstParam(params.status))?.key ?? 'ALL';
  const search = firstParam(params.q);

  const [result, counts] = await Promise.all([
    listBookings({
      where: active === 'ALL' ? {} : { bookingStatus: active },
      search,
      page: Number(firstParam(params.page)),
    }),
    prisma.booking.groupBy({ by: ['bookingStatus'], _count: { _all: true } }),
  ]);

  const countFor = (key: BookingStatus | 'ALL') =>
    key === 'ALL'
      ? counts.reduce((sum, group) => sum + group._count._all, 0)
      : (counts.find((group) => group.bookingStatus === key)?._count._all ?? 0);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-slate-800'>Booking Records</h1>
        <p className='text-sm text-slate-500 mt-1'>Every booking, newest first, with its receipt and the email the guest received.</p>
      </div>

      <div className='flex flex-wrap gap-2'>
        {FILTERS.map((filter) => {
          const query = new URLSearchParams();
          if (filter.key !== 'ALL') query.set('status', filter.key);
          if (search) query.set('q', search);
          const text = query.toString();
          return (
            <Link
              key={filter.key}
              href={text ? `/admin/bookings/records?${text}` : '/admin/bookings/records'}
              aria-current={filter.key === active ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter.key === active
                  ? 'bg-ocean-600 text-white shadow-sm shadow-ocean-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-ocean-600 hover:text-ocean-700'
              }`}
            >
              {filter.label} <span className='opacity-70'>({countFor(filter.key)})</span>
            </Link>
          );
        })}
      </div>

      <BookingList
        result={result}
        basePath='/admin/bookings/records'
        keep={active === 'ALL' ? {} : { status: active }}
        mode='records'
        emptyText='No bookings here yet.'
      />
    </div>
  );
}

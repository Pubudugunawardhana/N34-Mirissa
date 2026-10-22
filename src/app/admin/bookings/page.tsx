import Link from 'next/link';
import prisma from '@/lib/prisma';
import BookingList from '@/components/admin/BookingList';
import { BOOKING_SCOPES, firstParam, listBookings } from '@/lib/admin-bookings';
import { todayDateOnly } from '@/lib/booking';

export const dynamic = 'force-dynamic';

export default async function AdminNewBookings({ searchParams }: PageProps<'/admin/bookings'>) {
  const params = await searchParams;
  const today = new Date(`${todayDateOnly()}T00:00:00.000Z`);

  const [result, arrivingToday, confirmedUpcoming, waiting] = await Promise.all([
    listBookings({ where: BOOKING_SCOPES.new, search: firstParam(params.q), page: Number(firstParam(params.page)) }),
    prisma.booking.count({ where: { checkIn: today, bookingStatus: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.booking.count({ where: { bookingStatus: 'CONFIRMED', checkIn: { gt: today } } }),
    prisma.booking.count({ where: BOOKING_SCOPES.new }),
  ]);

  const summary = [
    { label: 'Waiting to confirm', value: waiting, hint: 'Assign a room to confirm each one' },
    { label: 'Arriving today', value: arrivingToday, hint: 'Check-ins due today' },
    { label: 'Confirmed, still to arrive', value: confirmedUpcoming, hint: 'Check-in after today' },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-slate-800'>New Bookings</h1>
          <p className='text-sm text-slate-500 mt-1'>Bookings waiting for the hotel. Assign a room to confirm one, or cancel it.</p>
        </div>
        <Link href='/admin/bookings/walk-in' className='inline-flex h-10 items-center gap-1.5 rounded-lg bg-ocean-600 px-4 text-sm font-semibold text-white shadow-sm shadow-ocean-600/20 transition-colors hover:bg-ocean-700'>
          <span aria-hidden='true' className='text-lg leading-none'>+</span> Walk-in booking
        </Link>
      </div>

      <div className='grid gap-4 sm:grid-cols-3'>
        {summary.map((item) => (
          <div key={item.label} className='bg-white p-5 rounded-2xl border border-slate-200 shadow-sm'>
            <p className='text-sm font-medium text-slate-500'>{item.label}</p>
            <p className='mt-1 text-3xl font-bold text-slate-800'>{item.value}</p>
            <p className='mt-1 text-xs text-slate-400'>{item.hint}</p>
          </div>
        ))}
      </div>

      <BookingList
        result={result}
        basePath='/admin/bookings'
        mode='new'
        emptyText='No new bookings. Everything has been confirmed or cancelled.'
      />
    </div>
  );
}

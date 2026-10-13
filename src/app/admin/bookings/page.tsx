import type { BookingStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { setBookingStatus, setPaymentStatus } from '@/app/actions/bookings-admin';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { MEAL_PLANS, formatLKR, formatStayDate, guestSummary, nightsBetween } from '@/lib/booking';

export const dynamic = 'force-dynamic';

const TABS: { key: BookingStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const actionClass = 'font-medium transition-colors';

export default async function AdminBookings({ searchParams }: PageProps<'/admin/bookings'>) {
  const params = await searchParams;
  const activeTab = TABS.find((tab) => tab.key === params.status)?.key ?? 'ALL';

  const [bookings, counts] = await Promise.all([
    prisma.booking.findMany({
      where: activeTab === 'ALL' ? {} : { bookingStatus: activeTab },
      include: { room: true, user: true },
      orderBy: { createdAt: 'desc' },
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
        <h1 className='text-2xl font-bold text-slate-800'>Bookings Management</h1>
        <p className='text-sm text-slate-500 mt-1'>Every reservation with its booking and payment status.</p>
      </div>

      <div className='flex flex-wrap gap-2'>
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === 'ALL' ? '/admin/bookings' : `/admin/bookings?status=${tab.key}`}
            aria-current={tab.key === activeTab ? 'page' : undefined}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab.key === activeTab
                ? 'bg-ocean-600 text-white shadow-sm shadow-ocean-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-ocean-600 hover:text-ocean-700'
            }`}
          >
            {tab.label} <span className='opacity-70'>({countFor(tab.key)})</span>
          </Link>
        ))}
      </div>

      <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
        {bookings.length === 0 ? (
          <div className='px-6 py-16 text-center text-sm text-slate-500'>No bookings here yet.</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left'>
              <thead className='bg-slate-50 border-b border-slate-200'>
                <tr>
                  <th className='p-4 text-sm font-semibold text-slate-600'>Reference</th>
                  <th className='p-4 text-sm font-semibold text-slate-600'>Guest</th>
                  <th className='p-4 text-sm font-semibold text-slate-600'>Room & stay</th>
                  <th className='p-4 text-sm font-semibold text-slate-600'>Total</th>
                  <th className='p-4 text-sm font-semibold text-slate-600'>Status</th>
                  <th className='p-4 text-sm font-semibold text-slate-600'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {bookings.map(b => {
                  const nights = nightsBetween(b.checkIn, b.checkOut);
                  const isCancelled = b.bookingStatus === 'CANCELLED';
                  return (
                    <tr key={b.id} className='align-top'>
                      <td className='p-4'>
                        <Link href={`/book/confirmation/${b.id}`} className='font-mono text-sm font-semibold text-ocean-700 hover:underline'>
                          {b.reference}
                        </Link>
                        <p className='text-xs text-slate-500 mt-1'>{b.createdAt.toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' })}</p>
                      </td>
                      <td className='p-4'>
                        <p className='font-medium'>{b.guestName || b.user.name}</p>
                        <p className='text-xs text-slate-500'>{b.user.email}</p>
                        {b.phone && <p className='text-xs text-slate-500'>{b.phone}</p>}
                      </td>
                      <td className='p-4 text-sm'>
                        <p className='font-medium'>{b.room.name}</p>
                        <p className='text-slate-600'>
                          {formatStayDate(b.checkIn)} → {formatStayDate(b.checkOut)} ({nights} {nights === 1 ? 'night' : 'nights'})
                        </p>
                        <p className='text-xs text-slate-500'>
                          {guestSummary(b.adults, b.children)} · {MEAL_PLANS[b.mealPlan].label}
                        </p>
                        {b.specialRequests && <p className='text-xs text-slate-500 mt-1 max-w-xs'>Note: {b.specialRequests}</p>}
                      </td>
                      <td className='p-4 font-medium whitespace-nowrap'>{formatLKR(b.totalAmount)}</td>
                      <td className='p-4'>
                        <div className='flex flex-col items-start gap-1.5'>
                          <BookingStatusBadge status={b.bookingStatus} />
                          <PaymentStatusBadge status={b.paymentStatus} />
                        </div>
                      </td>
                      <td className='p-4 text-sm'>
                        <div className='flex flex-col items-start gap-2'>
                          {b.bookingStatus === 'PENDING' && (
                            <form action={setBookingStatus.bind(null, b.id, 'CONFIRMED')}>
                              <button className={`${actionClass} text-emerald-600 hover:text-emerald-800`}>Confirm</button>
                            </form>
                          )}
                          {!isCancelled && b.paymentStatus !== 'PAID' && (
                            <form action={setPaymentStatus.bind(null, b.id, 'PAID')}>
                              <button className={`${actionClass} text-ocean-600 hover:text-ocean-800`}>Mark paid</button>
                            </form>
                          )}
                          {b.paymentStatus === 'PAID' && (
                            <form action={setPaymentStatus.bind(null, b.id, isCancelled ? 'REFUNDED' : 'PENDING')}>
                              <button className={`${actionClass} text-slate-500 hover:text-slate-700`}>
                                {isCancelled ? 'Mark refunded' : 'Mark unpaid'}
                              </button>
                            </form>
                          )}
                          {!isCancelled && (
                            <form action={setBookingStatus.bind(null, b.id, 'CANCELLED')}>
                              <ConfirmSubmitButton
                                confirmMessage={`Cancel booking ${b.reference}? The room becomes available again and this cannot be undone.`}
                                className={`${actionClass} text-red-600 hover:text-red-800`}
                              >
                                Cancel
                              </ConfirmSubmitButton>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

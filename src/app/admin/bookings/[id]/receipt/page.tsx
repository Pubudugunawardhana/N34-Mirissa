import Link from 'next/link';
import { notFound } from 'next/navigation';
import PrintButton from '@/components/admin/PrintButton';
import BookingSummary from '@/components/booking/BookingSummary';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { getHotelContact } from '@/lib/hotel';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function BookingReceiptPage({ params, searchParams }: PageProps<'/admin/bookings/[id]/receipt'>) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  // Set by the walk-in screen right after it created the booking.
  const justCreated = query.new === '1';

  const [booking, hotel] = await Promise.all([
    prisma.booking.findUnique({ where: { id }, include: { room: true, charges: { orderBy: { createdAt: 'asc' } } } }),
    getHotelContact(),
  ]);
  if (!booking) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {justCreated && booking.source === 'WALK_IN' && (
        <div role="status" className="flex items-start gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200 print:hidden">
          <svg className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <p>
            <span className="font-semibold">Walk-in booking created.</span> Room {booking.roomNumber} is held for {booking.guestName}. Print the receipt or save it as a PDF for the guest.
          </p>
        </div>
      )}
      {/* Not printed. */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/admin/bookings/records" className="text-sm text-slate-500 hover:text-ocean-600">← Back to booking records</Link>
        <div className="flex items-center gap-2">
          {/* The email the guest received: the payment receipt once paid, otherwise the booking email. */}
          <a
            href={`/admin/bookings/${booking.id}/email${booking.paymentStatus === 'PAID' ? '?type=payment' : ''}`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700"
          >
            View email
          </a>
          <PrintButton className="inline-flex h-10 items-center rounded-lg bg-ocean-600 px-4 text-sm font-semibold text-white shadow-sm shadow-ocean-600/20 transition-colors hover:bg-ocean-700" />
        </div>
      </div>

      {/* theme-fixed: a receipt is always printed dark on white, whatever theme the admin uses. */}
      <article className="theme-fixed rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <p className="text-2xl font-bold tracking-wide text-ocean-900">
              N34 <span className="text-sm font-medium uppercase tracking-[0.25em] text-sand-600">Mirissa</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">{hotel.address}</p>
            <p className="text-sm text-slate-500">{hotel.phone} · {hotel.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Booking receipt</p>
            <p className="mt-1 font-mono text-xl font-semibold tracking-widest text-ocean-800">{booking.reference}</p>
            <p className="mt-1 text-sm text-slate-500">
              {booking.source === 'WALK_IN' ? 'Booked at the hotel (walk-in)' : 'Booked'}{' '}
              {booking.createdAt.toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-slate-200 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Guest</p>
            <p className="mt-1 font-semibold text-slate-800">{booking.guestName || 'Guest'}</p>
            {booking.phone && <p className="text-sm text-slate-600">{booking.phone}</p>}
            {booking.email && <p className="break-all text-sm text-slate-600">{booking.email}</p>}
            {booking.idNumber && <p className="text-sm text-slate-600">ID {booking.idNumber}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</p>
            <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
              <BookingStatusBadge status={booking.bookingStatus} />
              <PaymentStatusBadge status={booking.paymentStatus} />
            </div>
          </div>
        </section>

        <section className="pt-2">
          <BookingSummary booking={booking} roomName={booking.room.name} />
        </section>

        {booking.specialRequests && (
          <section className="mt-2 rounded-xl bg-slate-50 p-4 text-sm">
            <p className="mb-1 font-medium text-slate-700">Special requests</p>
            <p className="whitespace-pre-line text-slate-600">{booking.specialRequests}</p>
          </section>
        )}

        <footer className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          Thank you for staying with N34 Mirissa. Payment is settled at the hotel.
        </footer>
      </article>
    </div>
  );
}

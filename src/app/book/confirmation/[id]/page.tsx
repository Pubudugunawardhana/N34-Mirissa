import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cancelBooking } from '@/app/actions/book';
import { auth } from '@/auth';
import BookingSummary from '@/components/booking/BookingSummary';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { isCancellable } from '@/lib/booking';
import { bookingAccess } from '@/lib/booking-access';
import prisma from '@/lib/prisma';

// The address can carry a guest's secret key, so it must not end up in search results or be sent to other sites.
export const metadata: Metadata = {
  title: 'Your booking | N34 Mirissa',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

const primaryButtonClass =
  'flex h-12 items-center justify-center rounded-xl bg-ocean-600 text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700';
const secondaryButtonClass =
  'flex h-12 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700';

export default async function BookingConfirmationPage({ params, searchParams }: PageProps<'/book/confirmation/[id]'>) {
  const { id } = await params;
  const query = await searchParams;
  const isNew = !!query.new;
  const key = typeof query.key === 'string' ? query.key : null;

  const [session, booking] = await Promise.all([
    auth(),
    prisma.booking.findUnique({ where: { id }, include: { room: true } }),
  ]);

  // Same 404 for "does not exist" and "not yours", so booking ids cannot be probed.
  const access = booking && bookingAccess(booking, session?.user, key);
  if (!booking || !access) notFound();

  const canCancel = (access === 'owner' || access === 'guest') && isCancellable(booking);

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav variant="solid" />

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-32 sm:px-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-ocean-900/5 sm:p-10">
          <div className="text-center">
            {isNew && (
              <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
            )}
            <h1 className="font-display text-3xl font-semibold text-ocean-900">
              {isNew ? 'Booking received' : 'Booking details'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isNew
                ? `Thank you, ${booking.guestName}. A copy has been sent to ${booking.email || 'your email'}. The hotel will confirm your booking shortly.`
                : `Booked for ${booking.guestName} · ${booking.phone}`}
            </p>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Booking reference</p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-widest text-ocean-800">{booking.reference}</p>

            <div className="mt-4 flex justify-center gap-2">
              <BookingStatusBadge status={booking.bookingStatus} />
              <PaymentStatusBadge status={booking.paymentStatus} />
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-2">
            <BookingSummary booking={booking} roomName={booking.room.name} />
          </div>

          {booking.specialRequests && (
            <div className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm">
              <p className="mb-1 font-medium text-slate-700">Special requests</p>
              <p className="whitespace-pre-line text-slate-600">{booking.specialRequests}</p>
            </div>
          )}

          {access === 'guest' && (
            <div className="mt-6 rounded-2xl border border-ocean-100 bg-ocean-50 p-4 text-sm text-ocean-800">
              <p className="font-semibold">Keep your booking reference.</p>
              <p className="mt-1">
                You booked without an account. To come back to this page later, use the link in your email, or go to{' '}
                <Link href="/book/find" className="font-semibold underline-offset-2 hover:underline">Find my booking</Link> and enter
                the reference above with your email address.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {access === 'guest' ? (
              <Link href="/register" className={primaryButtonClass}>Create an account</Link>
            ) : (
              <Link href={access === 'admin' ? '/admin/bookings' : '/user'} className={primaryButtonClass}>
                {access === 'admin' ? 'Back to all bookings' : 'View my bookings'}
              </Link>
            )}
            <Link href="/rooms" className={secondaryButtonClass}>Browse more rooms</Link>
          </div>

          {canCancel && (
            <form action={cancelBooking.bind(null, booking.id, key)} className="mt-4 text-center">
              <ConfirmSubmitButton
                title="Cancel this booking?"
                confirmLabel="Cancel booking"
                cancelLabel="Keep booking"
                confirmMessage={`Booking ${booking.reference} will be cancelled and the room released. This cannot be undone.`}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                Cancel this booking
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

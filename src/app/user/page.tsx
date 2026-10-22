import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cancelBooking } from '@/app/actions/book';
import { AvatarForm, DetailsForm, PasswordForm } from '@/components/account/ProfileForms';
import Alert from '@/components/auth/Alert';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import RoomCover from '@/components/rooms/RoomCover';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import UserAvatar from '@/components/UserAvatar';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { MEAL_PLANS, formatLKR, formatStayDate, guestSummary, isCancellable, nightsBetween } from '@/lib/booking';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'My account | N34 Mirissa' };

const TABS = [
  { key: 'bookings', label: 'My bookings', href: '/user' },
  { key: 'profile', label: 'Profile settings', href: '/user?tab=profile' },
] as const;

export default async function UserDashboard({ searchParams }: PageProps<'/user'>) {
  const sessionUser = await requireUser();
  const params = await searchParams;
  const activeTab = params.tab === 'profile' ? 'profile' : 'bookings';

  const [user, bookings] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessionUser.id } }),
    prisma.booking.findMany({
      where: { userId: sessionUser.id },
      include: { room: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  // The account was deleted while its session was still alive.
  if (!user) redirect('/login');

  const displayName = user.name || 'Guest';

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      {/* Header band */}
      <header className="theme-fixed relative overflow-hidden bg-ocean-900 pb-24 pt-36 text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-ocean-600/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-sand-500/15 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto flex max-w-5xl flex-wrap items-center gap-6 px-4 sm:px-6">
          <UserAvatar name={displayName} image={user.image} pixels={160} className="h-20 w-20 text-3xl shadow-xl shadow-ocean-900/40 ring-4 ring-white/15" />
          <div className="min-w-0">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.3em] text-sand-200">My account</span>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">Welcome, {displayName}</h1>
            <p className="mt-2 break-all text-sm font-light text-slate-300">
              {user.email} · Member since {user.createdAt.toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-8 max-w-5xl px-4 pb-10 sm:px-6">
        {/* Tabs */}
        <nav aria-label="Account sections" className="inline-flex rounded-full border border-slate-200 bg-white p-1.5 shadow-lg shadow-ocean-900/10">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={tab.key === activeTab ? 'page' : undefined}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                tab.key === activeTab
                  ? 'bg-ocean-600 text-white shadow-sm shadow-ocean-600/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-ocean-700'
              }`}
            >
              {tab.label}
              {tab.key === 'bookings' && bookings.length > 0 && <span className="ml-1.5 opacity-70">({bookings.length})</span>}
            </Link>
          ))}
        </nav>

        {activeTab === 'profile' ? (
          <div className="mt-8 space-y-6">
            {params.emailChanged && !user.pendingEmail && (
              <Alert variant="success">Your email address has been changed. Use {user.email} to sign in from now on.</Alert>
            )}
            <AvatarForm name={displayName} image={user.image} />
            <DetailsForm user={{ name: user.name ?? '', phone: user.phone ?? '', email: user.email, pendingEmail: user.pendingEmail }} />
            <PasswordForm />
          </div>
        ) : (
          <>
            <div className="mt-10 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-ocean-900">Your bookings</h2>
              <Link href="/rooms" className="text-sm font-semibold text-ocean-600 hover:underline">
                Book another room
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <p className="font-display text-xl font-semibold text-ocean-900">You have no bookings yet</p>
                <p className="mt-2 text-sm text-slate-500">Find a room and your booking will show up here.</p>
                <Link
                  href="/rooms"
                  className="mt-6 inline-flex h-11 items-center rounded-xl bg-sand-500 px-6 text-sm font-semibold text-white shadow-md shadow-sand-500/25 transition-colors hover:bg-sand-600"
                >
                  Browse rooms
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {bookings.map((booking) => {
                  const nights = nightsBetween(booking.checkIn, booking.checkOut);
                  return (
                    <article
                      key={booking.id}
                      className="grid overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm sm:grid-cols-[200px_1fr]"
                    >
                      <div className="relative min-h-40 bg-slate-200">
                        <RoomCover src={booking.room.images[0]?.url} alt={booking.room.name} sizes="(min-width: 640px) 200px, 100vw" />
                      </div>

                      <div className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-display text-xl font-semibold text-ocean-900">
                              {booking.room.name}
                              {booking.roomNumber && <span className="ml-2 text-sm font-medium text-slate-500">Room {booking.roomNumber}</span>}
                            </h3>
                            <p className="mt-0.5 font-mono text-xs tracking-wider text-slate-400">{booking.reference}</p>
                          </div>
                          <div className="flex gap-2">
                            <BookingStatusBadge status={booking.bookingStatus} />
                            <PaymentStatusBadge status={booking.paymentStatus} />
                          </div>
                        </div>

                        <p className="mt-4 text-sm text-slate-600">
                          {formatStayDate(booking.checkIn)} → {formatStayDate(booking.checkOut)}
                          <span className="text-slate-400"> · {nights} {nights === 1 ? 'night' : 'nights'}</span>
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {guestSummary(booking.adults, booking.children)} · {MEAL_PLANS[booking.mealPlan].label}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                          <p className="font-display text-xl font-semibold text-ocean-900">{formatLKR(booking.totalAmount)}</p>
                          <div className="flex items-center gap-2">
                            {isCancellable(booking) && (
                              <form action={cancelBooking.bind(null, booking.id, null)}>
                                <ConfirmSubmitButton
                                  title="Cancel this booking?"
                                  confirmLabel="Cancel booking"
                                  cancelLabel="Keep booking"
                                  confirmMessage={`Booking ${booking.reference} will be cancelled and the room released. This cannot be undone.`}
                                  className="h-10 rounded-xl px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                                >
                                  Cancel booking
                                </ConfirmSubmitButton>
                              </form>
                            )}
                            <Link
                              href={`/book/confirmation/${booking.id}`}
                              className="flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700"
                            >
                              View details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

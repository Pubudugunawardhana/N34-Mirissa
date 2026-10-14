import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import BookingForm from '@/components/booking/BookingForm';
import BookingPausedNotice from '@/components/booking/BookingPausedNotice';
import RoomCover from '@/components/rooms/RoomCover';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { parseDateOnly } from '@/lib/booking';
import { getSiteSettings } from '@/lib/hotel';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const metadata: Metadata = { title: 'Book a room | N34 Mirissa' };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function clamp(value: string | undefined, min: number, max: number, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
}

export default async function BookPage({ searchParams }: PageProps<'/book'>) {
  // Booking does not need an account. A signed-in guest gets their saved details filled in
  // (read fresh from the database: the phone number is not part of the login session).
  const [session, params, site] = await Promise.all([auth(), searchParams, getSiteSettings()]);

  const roomId = first(params.roomId);
  if (!roomId) redirect('/rooms');

  // Fetched together: each query is a long round trip to the database.
  const [user, room] = await Promise.all([
    session?.user ? prisma.user.findUnique({ where: { id: session.user.id } }) : null,
    prisma.room.findFirst({
      where: { id: roomId, isActive: true },
      include: { images: { orderBy: { position: 'asc' }, take: 1 } },
    }),
  ]);
  // A room that was removed or hidden since the link was made: send the guest to the rooms they can still book.
  if (!room) redirect('/rooms?unavailable=1#rooms');

  const checkIn = first(params.checkIn) ?? '';
  const checkOut = first(params.checkOut) ?? '';

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      {/* Hero */}
      <header className="theme-fixed relative flex h-[52vh] min-h-[400px] items-center justify-center overflow-hidden bg-ocean-900 text-white">
        <RoomCover src={room.images[0]?.url} alt="" sizes="100vw" priority />
        {/* Darkens the photo so the white text stays readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ocean-900/70 via-ocean-900/50 to-ocean-900/80" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 pb-10 pt-16 text-center">
          <Link href={`/rooms/${room.id}`} className="mb-5 inline-block text-sm font-medium text-white/80 transition-colors hover:text-white">
            ← Back to room
          </Link>
          <span className="mb-4 block text-xs font-medium uppercase tracking-[0.3em] text-sand-200 sm:text-sm">Reservation</span>
          <h1 className="font-display text-4xl font-semibold drop-shadow-lg md:text-5xl">Complete your booking</h1>
          <p className="mt-4 font-light text-slate-200">{room.name}</p>
        </div>
      </header>

      {/* Form and summary, overlapping the hero */}
      <main className="relative z-10 mx-auto -mt-16 max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        {site.bookingsPaused ? (
          <BookingPausedNotice site={site} variant="card" />
        ) : (
        <BookingForm
          room={{
            id: room.id,
            name: room.name,
            price: room.price,
            area: room.area,
            maxAdults: room.maxAdults,
            maxChildren: room.maxChildren,
            image: room.images[0]?.url ?? null,
          }}
          // Offered to visitors who are not signed in; they come straight back to this booking afterwards.
          signInHref={user ? null : `/login?callbackUrl=${encodeURIComponent(`/book?${new URLSearchParams(Object.entries(params).flatMap(([key, value]) => (typeof value === 'string' ? [[key, value]] : [])))}`)}`}
          initial={{
            guestName: user?.name ?? '',
            phone: user?.phone ?? '',
            // Staff accounts can have a plain username instead of an email address.
            email: user?.email.includes('@') ? user.email : '',
            checkIn: parseDateOnly(checkIn) ? checkIn : '',
            checkOut: parseDateOnly(checkOut) ? checkOut : '',
            adults: clamp(first(params.adults), 1, room.maxAdults, Math.min(2, room.maxAdults)),
            children: clamp(first(params.children), 0, room.maxChildren, 0),
          }}
        />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

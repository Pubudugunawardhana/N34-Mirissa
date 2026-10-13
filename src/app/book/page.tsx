import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import BookingForm from '@/components/booking/BookingForm';
import RoomCover from '@/components/rooms/RoomCover';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { parseDateOnly } from '@/lib/booking';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Book a room | N34 Mirissa' };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function clamp(value: string | undefined, min: number, max: number, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
}

export default async function BookPage({ searchParams }: PageProps<'/book'>) {
  const sessionUser = await requireUser();
  // Read fresh from the database: the saved phone number is not part of the login session.
  const user = (await prisma.user.findUnique({ where: { id: sessionUser.id } })) ?? { name: sessionUser.name, email: sessionUser.email, phone: null };
  const params = await searchParams;

  const roomId = first(params.roomId);
  if (!roomId) redirect('/rooms');

  const room = await prisma.room.findFirst({
    where: { id: roomId, isActive: true },
    include: { images: { orderBy: { position: 'asc' }, take: 1 } },
  });
  if (!room) notFound();

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
          initial={{
            guestName: user.name ?? '',
            phone: user.phone ?? '',
            // Staff accounts can have a plain username instead of an email address.
            email: user.email?.includes('@') ? user.email : '',
            checkIn: parseDateOnly(checkIn) ? checkIn : '',
            checkOut: parseDateOnly(checkOut) ? checkOut : '',
            adults: clamp(first(params.adults), 1, room.maxAdults, Math.min(2, room.maxAdults)),
            children: clamp(first(params.children), 0, room.maxChildren, 0),
          }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}

'use server';

import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/auth';
import { getRoomsLeft } from '@/lib/availability';
import { quoteBooking, todayDateOnly, validateStay } from '@/lib/booking';
import { bookingAccess } from '@/lib/booking-access';
import { SoldOutError, isRetryableBookingError, newReference } from '@/lib/booking-create';
import { getSiteSettings } from '@/lib/hotel';
import { sendBookingConfirmationEmail } from '@/lib/mail';
import { BookingSchema, type FieldErrors } from '@/lib/validation';

export type BookingFormState = {
  message?: string;
  errors?: FieldErrors;
};

export type AvailabilityResult = { ok: true; roomsLeft: number } | { ok: false; message: string };

// Called by the booking form as the dates change.
export async function checkAvailability(roomId: string, checkIn: string, checkOut: string): Promise<AvailabilityResult> {
  const stay = validateStay(checkIn, checkOut);
  if (!stay.ok) return stay;

  const site = await getSiteSettings();
  if (site.bookingsPaused) return { ok: false, message: site.bookingsPausedMessage };

  const room = await prisma.room.findFirst({ where: { id: roomId, isActive: true } });
  if (!room) return { ok: false, message: 'This room is no longer available.' };

  return { ok: true, roomsLeft: await getRoomsLeft(room, stay.checkIn, stay.checkOut) };
}

export async function createBooking(prevState: BookingFormState, formData: FormData): Promise<BookingFormState> {
  // Paused by the hotel under Site Settings: nothing is booked online until it is switched back on.
  const site = await getSiteSettings();
  if (site.bookingsPaused) return { message: site.bookingsPausedMessage };

  // Signing in is optional. Without an account the booking gets a secret key instead of an owner.
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestToken = userId ? null : randomBytes(24).toString('hex');

  const validatedFields = BookingSchema.safeParse({
    roomId: formData.get('roomId'),
    guestName: formData.get('guestName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    adults: formData.get('adults'),
    children: formData.get('children'),
    mealPlan: formData.get('mealPlan'),
    specialRequests: formData.get('specialRequests') ?? '',
  });

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Please fix the highlighted fields.',
    };
  }

  const stay = validateStay(formData.get('checkIn'), formData.get('checkOut'));
  if (!stay.ok) return { message: stay.message };

  const { roomId, adults, children, mealPlan, specialRequests, ...guest } = validatedFields.data;

  const room = await prisma.room.findFirst({
    where: { id: roomId, isActive: true },
    include: { images: { orderBy: { position: 'asc' }, take: 1 } },
  });
  if (!room) return { message: 'This room is no longer available.' };

  if (adults > room.maxAdults || children > room.maxChildren) {
    return {
      message: `This room fits up to ${room.maxAdults} adults and ${room.maxChildren} children.`,
    };
  }

  // The price never comes from the browser.
  const quote = quoteBooking({ pricePerNight: room.price, nights: stay.nights, adults, children, mealPlan });

  let bookingId: string | undefined;
  for (let attempt = 0; attempt < 3 && !bookingId; attempt++) {
    try {
      // Serializable: two guests racing for the last room cannot both get it.
      const booking = await prisma.$transaction(
        async (tx) => {
          if ((await getRoomsLeft(room, stay.checkIn, stay.checkOut, tx)) < 1) throw new SoldOutError();

          return tx.booking.create({
            data: {
              reference: newReference(),
              userId,
              guestToken,
              roomId: room.id,
              checkIn: stay.checkIn,
              checkOut: stay.checkOut,
              adults,
              children,
              mealPlan,
              specialRequests: specialRequests || null,
              pricePerNight: room.price,
              mealTotal: quote.mealTotal,
              totalAmount: quote.total,
              ...guest,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      bookingId = booking.id;

      try {
        await sendBookingConfirmationEmail(booking, { name: room.name, coverUrl: room.images[0]?.url });
      } catch (error) {
        console.error('Failed to send booking confirmation email', error);
      }
    } catch (error) {
      if (error instanceof SoldOutError) {
        return { message: 'Sorry, this room has just sold out for these dates. Please choose different dates.' };
      }
      if (!isRetryableBookingError(error) || attempt === 2) {
        console.error('Failed to create booking', error);
        return { message: 'Something went wrong while saving your booking. Please try again.' };
      }
    }
  }

  revalidatePath('/user');
  revalidatePath('/admin/bookings');
  redirect(`/book/confirmation/${bookingId}?new=1${guestToken ? `&key=${guestToken}` : ''}`);
}

// `key` is the secret from a guest booking's link; signed-in owners pass null.
export async function cancelBooking(bookingId: string, key: string | null) {
  const session = await auth();
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  // Only the account that made the booking, or a guest holding its key, may cancel it.
  const access = booking && bookingAccess(booking, session?.user, key);
  if (access !== 'owner' && access !== 'guest') return;

  // A booking can be cancelled up to the day before check-in.
  await prisma.booking.updateMany({
    where: {
      id: bookingId,
      bookingStatus: { not: 'CANCELLED' },
      checkIn: { gt: new Date(`${todayDateOnly()}T00:00:00.000Z`) },
    },
    data: { bookingStatus: 'CANCELLED' },
  });

  revalidatePath('/user');
  revalidatePath('/admin/bookings');
  revalidatePath(`/book/confirmation/${bookingId}`);
}

export type FindBookingState = { message?: string };

// Lets a guest without an account get back to a booking using what they know: its reference and their email.
export async function findBooking(prevState: FindBookingState, formData: FormData): Promise<FindBookingState> {
  const reference = String(formData.get('reference') ?? '').trim().toUpperCase();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!reference || !email) return { message: 'Enter your booking reference and the email you booked with.' };

  const booking = await prisma.booking.findUnique({ where: { reference } });

  // One answer for "no such reference" and "wrong email", so references cannot be checked one by one.
  if (!booking || booking.email.toLowerCase() !== email) {
    return { message: 'We could not find a booking with that reference and email. Please check both and try again.' };
  }
  if (!booking.guestToken) {
    return { message: 'This booking was made with an account. Please sign in to see it under My Account.' };
  }

  redirect(`/book/confirmation/${booking.id}?key=${booking.guestToken}`);
}

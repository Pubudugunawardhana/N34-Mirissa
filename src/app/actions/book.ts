'use server';

import { randomInt } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getRoomsLeft } from '@/lib/availability';
import { formatLKR, formatStayDate, quoteBooking, todayDateOnly, validateStay } from '@/lib/booking';
import { sendBookingConfirmationEmail } from '@/lib/mail';
import { requireUser } from '@/lib/session';
import { BookingSchema, type FieldErrors } from '@/lib/validation';

export type BookingFormState = {
  message?: string;
  errors?: FieldErrors;
};

export type AvailabilityResult = { ok: true; roomsLeft: number } | { ok: false; message: string };

// No 0/O or 1/I, so a reference read over the phone cannot be mistyped.
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newReference() {
  let code = '';
  for (let i = 0; i < 6; i++) code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `N34-${code}`;
}

class SoldOutError extends Error {}

// Called by the booking form as the dates change.
export async function checkAvailability(roomId: string, checkIn: string, checkOut: string): Promise<AvailabilityResult> {
  const stay = validateStay(checkIn, checkOut);
  if (!stay.ok) return stay;

  const room = await prisma.room.findFirst({ where: { id: roomId, isActive: true } });
  if (!room) return { ok: false, message: 'This room is no longer available.' };

  return { ok: true, roomsLeft: await getRoomsLeft(room, stay.checkIn, stay.checkOut) };
}

export async function createBooking(prevState: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const user = await requireUser();

  const validatedFields = BookingSchema.safeParse({
    roomId: formData.get('roomId'),
    guestName: formData.get('guestName'),
    phone: formData.get('phone'),
    address: formData.get('address'),
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

  const room = await prisma.room.findFirst({ where: { id: roomId, isActive: true } });
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
              userId: user.id,
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
        if (user.email) {
          await sendBookingConfirmationEmail({
            to: user.email,
            bookingId: booking.id,
            reference: booking.reference,
            guestName: booking.guestName,
            roomName: room.name,
            stay: `${formatStayDate(stay.checkIn)} to ${formatStayDate(stay.checkOut)}`,
            total: formatLKR(booking.totalAmount),
          });
        }
      } catch (error) {
        console.error('Failed to send booking confirmation email', error);
      }
    } catch (error) {
      if (error instanceof SoldOutError) {
        return { message: 'Sorry, this room has just sold out for these dates. Please choose different dates.' };
      }
      // P2034 = the transaction lost a race and can be retried; P2002 = reference collision.
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2034' || error.code === 'P2002');
      if (!retryable || attempt === 2) {
        console.error('Failed to create booking', error);
        return { message: 'Something went wrong while saving your booking. Please try again.' };
      }
    }
  }

  revalidatePath('/user');
  revalidatePath('/admin/bookings');
  redirect(`/book/confirmation/${bookingId}?new=1`);
}

export async function cancelBooking(bookingId: string) {
  const user = await requireUser();

  // Guests can cancel their own bookings up to the day before check-in.
  await prisma.booking.updateMany({
    where: {
      id: bookingId,
      userId: user.id,
      bookingStatus: { not: 'CANCELLED' },
      checkIn: { gt: new Date(`${todayDateOnly()}T00:00:00.000Z`) },
    },
    data: { bookingStatus: 'CANCELLED' },
  });

  revalidatePath('/user');
  revalidatePath('/admin/bookings');
}

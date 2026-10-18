'use server';

import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getBookedCounts, getRoomsLeft, overlapping } from '@/lib/availability';
import { quoteBooking, validateStay } from '@/lib/booking';
import { SoldOutError, isRetryableBookingError, newReference } from '@/lib/booking-create';
import { sendPaymentReceivedEmail } from '@/lib/mail';
import prisma from '@/lib/prisma';
import { MAX_ROOM_NUMBER_LENGTH, getOccupancy } from '@/lib/room-occupancy';
import { requireAdmin } from '@/lib/session';
import { emailSchema, nameSchema, phoneSchema, type FieldErrors } from '@/lib/validation';

export type WalkInRoomOption = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  maxAdults: number;
  maxChildren: number;
  roomNumbers: string[];
  taken: { roomNumber: string; reference: string; guestName: string }[];
  roomsLeft: number;
};

export type WalkInOptions = { ok: true; rooms: WalkInRoomOption[] } | { ok: false; message: string };

// Every room type that can be booked, with what is still free for the chosen nights. Called as the dates change.
export async function getWalkInOptions(checkIn: string, checkOut: string): Promise<WalkInOptions> {
  await requireAdmin();
  const stay = validateStay(checkIn, checkOut);
  if (!stay.ok) return stay;

  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    include: { images: { orderBy: { position: 'asc' }, take: 1 } },
    orderBy: { price: 'asc' },
  });
  const [occupancy, booked] = await Promise.all([
    getOccupancy(rooms.map((room) => room.id), stay.checkIn, stay.checkOut),
    getBookedCounts(stay.checkIn, stay.checkOut),
  ]);

  return {
    ok: true,
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      image: room.images[0]?.url ?? null,
      price: room.price,
      maxAdults: room.maxAdults,
      maxChildren: room.maxChildren,
      roomNumbers: room.roomNumbers,
      taken: [...occupancy.get(room.id)!.taken.values()].map((booking) => ({
        roomNumber: booking.roomNumber!,
        reference: booking.reference,
        guestName: booking.guestName,
      })),
      roomsLeft: Math.max(0, room.quantity - (booked.get(room.id) ?? 0)),
    })),
  };
}

export type WalkInFormState = { message?: string; errors?: FieldErrors };

const WalkInSchema = z.object({
  roomId: z.string().min(1, 'Choose a room type.'),
  roomNumber: z.string().trim().min(1, 'Choose a room.').max(MAX_ROOM_NUMBER_LENGTH, 'Room number is too long.'),
  guestName: nameSchema,
  phone: phoneSchema,
  // Optional at the desk: an address only to email the receipt.
  email: z.union([z.literal(''), emailSchema]),
  idNumber: z.string().trim().max(30, 'ID number is too long.'),
  adults: z.coerce.number().int().min(1, 'At least 1 adult is required.'),
  children: z.coerce.number().int().min(0),
  mealPlan: z.enum(['ROOM_ONLY', 'BED_AND_BREAKFAST', 'HALF_BOARD', 'FULL_BOARD'], 'Choose a meal option.'),
  specialRequests: z.string().trim().max(1000, 'Notes are too long.'),
  payment: z.enum(['now', 'later'], 'Choose when the guest pays.'),
});

class RoomTakenError extends Error {}

// Books a room for a guest standing at the desk: confirmed straight away with its room number.
export async function createWalkInBooking(prevState: WalkInFormState, formData: FormData): Promise<WalkInFormState> {
  await requireAdmin();

  const parsed = WalkInSchema.safeParse({
    roomId: formData.get('roomId') ?? '',
    roomNumber: formData.get('roomNumber') ?? '',
    guestName: formData.get('guestName') ?? '',
    phone: formData.get('phone') ?? '',
    email: formData.get('email') ?? '',
    idNumber: formData.get('idNumber') ?? '',
    adults: formData.get('adults'),
    children: formData.get('children') || '0',
    mealPlan: formData.get('mealPlan'),
    specialRequests: formData.get('specialRequests') ?? '',
    payment: formData.get('payment'),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: 'Please fix the highlighted fields.' };

  const stay = validateStay(formData.get('checkIn'), formData.get('checkOut'));
  if (!stay.ok) return { message: stay.message };

  const { roomId, roomNumber, adults, children, mealPlan, payment, idNumber, email, specialRequests, ...guest } = parsed.data;

  const room = await prisma.room.findFirst({ where: { id: roomId, isActive: true }, include: { images: { orderBy: { position: 'asc' }, take: 1 } } });
  if (!room) return { message: 'This room type is not available.' };
  if (adults > room.maxAdults || children > room.maxChildren) {
    return { message: `${room.name} fits up to ${room.maxAdults} adults and ${room.maxChildren} children.` };
  }
  if (room.roomNumbers.length > 0 && !room.roomNumbers.includes(roomNumber)) {
    return { errors: { roomNumber: [`Room ${roomNumber} is not one of the ${room.name} rooms.`] }, message: 'Choose one of the listed rooms.' };
  }

  const quote = quoteBooking({ pricePerNight: room.price, nights: stay.nights, adults, children, mealPlan });
  const paidNow = payment === 'now';

  let bookingId: string | undefined;
  for (let attempt = 0; attempt < 3 && !bookingId; attempt++) {
    try {
      // Serializable, like an online booking: the desk and the website cannot both take the last room.
      const booking = await prisma.$transaction(
        async (tx) => {
          if ((await getRoomsLeft(room, stay.checkIn, stay.checkOut, tx)) < 1) throw new SoldOutError();
          const clash = await tx.booking.findFirst({ where: { roomId, roomNumber, ...overlapping(stay.checkIn, stay.checkOut) } });
          if (clash) throw new RoomTakenError();

          return tx.booking.create({
            data: {
              reference: newReference(),
              source: 'WALK_IN',
              bookingStatus: 'CONFIRMED',
              roomId,
              roomNumber,
              // Lets the guest open the booking from the emailed link without an account.
              guestToken: randomBytes(24).toString('hex'),
              checkIn: stay.checkIn,
              checkOut: stay.checkOut,
              adults,
              children,
              mealPlan,
              specialRequests: specialRequests || null,
              idNumber: idNumber || null,
              email: email.toLowerCase(),
              pricePerNight: room.price,
              mealTotal: quote.mealTotal,
              totalAmount: quote.total,
              paymentStatus: paidNow ? 'PAID' : 'PENDING',
              amountPaid: paidNow ? quote.total : 0,
              ...guest,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      bookingId = booking.id;

      if (paidNow && booking.email.includes('@')) {
        try {
          await sendPaymentReceivedEmail(booking, { name: room.name, coverUrl: room.images[0]?.url });
        } catch (error) {
          console.error('Failed to send the walk-in payment email', error);
        }
      }
    } catch (error) {
      if (error instanceof SoldOutError) return { message: `Every ${room.name} room is taken for these dates.` };
      if (error instanceof RoomTakenError) {
        return { errors: { roomNumber: [`Room ${roomNumber} is already taken for these dates.`] }, message: 'Choose another room.' };
      }
      if (!isRetryableBookingError(error) || attempt === 2) {
        console.error('Failed to create walk-in booking', error);
        return { message: 'Something went wrong while saving the booking. Please try again.' };
      }
    }
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/rooms');
  // The receipt, ready to print and hand over.
  redirect(`/admin/bookings/${bookingId}/receipt?new=1`);
}

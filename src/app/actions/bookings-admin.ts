'use server';

import type { BookingStatus, PaymentStatus } from '@prisma/client';
import { z } from 'zod';
import { MEAL_PLAN_KEYS, MEAL_PLAN_MEALS, type MealPlanKey } from '@/lib/booking';
import { recalculateBooking } from '@/lib/booking-bill';
import { sendPaymentReceivedEmail } from '@/lib/mail';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { MAX_ROOM_NUMBER_LENGTH, findClash } from '@/lib/room-occupancy';
import { requireAdmin } from '@/lib/session';

const BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED'];
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PARTIAL', 'PAID', 'REFUNDED'];

function revalidateBookings() {
  // "layout": both booking screens and the sidebar count change together.
  revalidatePath('/admin', 'layout');
  revalidatePath('/admin');
  revalidatePath('/user');
}

export async function setBookingStatus(bookingId: string, status: BookingStatus) {
  await requireAdmin();
  if (!BOOKING_STATUSES.includes(status)) throw new Error('Unknown booking status');

  // A cancelled booking has released its room, so it is never brought back.
  await prisma.booking.updateMany({
    where: { id: bookingId, bookingStatus: { not: 'CANCELLED' } },
    data: { bookingStatus: status },
  });
  revalidateBookings();
}

export async function setPaymentStatus(bookingId: string, status: PaymentStatus) {
  await requireAdmin();
  if (!PAYMENT_STATUSES.includes(status)) throw new Error('Unknown payment status');

  const before = await prisma.booking.findUnique({ where: { id: bookingId }, select: { paymentStatus: true, totalAmount: true } });
  if (!before) return;
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    // "Paid" settles the whole bill, extras included; "Unpaid" clears what was recorded.
    data: { paymentStatus: status, ...(status === 'PAID' ? { amountPaid: before.totalAmount } : status === 'PENDING' ? { amountPaid: 0 } : {}) },
    include: { charges: { orderBy: { createdAt: 'asc' } }, mealChoices: { orderBy: { meal: 'asc' } }, room: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
  });

  // The guest gets a receipt when the stay becomes paid; marking it unpaid again sends nothing.
  if (status === 'PAID' && before.paymentStatus !== 'PAID' && booking.email.includes('@')) {
    try {
      await sendPaymentReceivedEmail(booking, { name: booking.room.name, coverUrl: booking.room.images[0]?.url });
    } catch (error) {
      // The payment is recorded either way; a failed email must not undo it.
      console.error('Failed to send the payment email', error);
    }
  }
  revalidateBookings();
  // Taking a payment ends on the receipt, ready to print or save for the guest.
  if (status === 'PAID') redirect(`/admin/bookings/${bookingId}/receipt`);
}

export type AssignRoomState = { error?: string; saved?: number };

// Gives the booking its actual room. Confirms a booking that was still waiting; on a confirmed one it just changes the room.
export async function assignRoom(bookingId: string, prevState: AssignRoomState, formData: FormData): Promise<AssignRoomState> {
  await requireAdmin();

  const roomNumber = String(formData.get('roomNumber') ?? '').trim().slice(0, MAX_ROOM_NUMBER_LENGTH);
  if (!roomNumber) return { error: 'Choose a room.' };

  // A cancelled booking has released its room, so it gets neither a number nor a new status.
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { room: true } });
  if (!booking || booking.bookingStatus === 'CANCELLED') return { error: 'This booking was cancelled, so it cannot be given a room.' };

  // When the room type has its own numbers, only those can be given out.
  const { roomNumbers } = booking.room;
  if (roomNumbers.length > 0 && !roomNumbers.includes(roomNumber)) {
    return { error: `Room ${roomNumber} is not one of the ${booking.room.name} rooms.` };
  }

  // Checked again here: someone else may have taken the room since the window was opened.
  const clash = await findClash(booking.roomId, roomNumber, booking.checkIn, booking.checkOut, booking.id);
  if (clash) {
    return { error: `Room ${roomNumber} is already taken for these dates by ${clash.guestName || 'another guest'} (${clash.reference}).` };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { roomNumber, bookingStatus: 'CONFIRMED' },
  });
  revalidateBookings();
  // A fresh value each time, so the window knows this save worked and can close.
  return { saved: Date.now() };
}


export type BillFormState = { error?: string; saved?: number };

// Changes and extras only apply to a live booking; a cancelled one keeps the bill it had.
async function openBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { bookingStatus: true } });
  return booking && booking.bookingStatus !== 'CANCELLED';
}

export async function changeMealPlan(bookingId: string, prevState: BillFormState, formData: FormData): Promise<BillFormState> {
  await requireAdmin();

  const mealPlan = String(formData.get('mealPlan') ?? '') as MealPlanKey;
  if (!MEAL_PLAN_KEYS.includes(mealPlan)) return { error: 'Choose a meal option.' };
  if (!(await openBooking(bookingId))) return { error: 'This booking was cancelled, so its bill cannot change.' };

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { mealPlan } });
    await tx.bookingMealChoice.deleteMany({ where: { bookingId, meal: { notIn: MEAL_PLAN_MEALS[mealPlan] } } });
    await recalculateBooking(tx, bookingId);
  });
  revalidateBookings();
  return { saved: Date.now() };
}

const ChargeSchema = z.object({
  description: z.string().trim().min(2, 'Describe the charge (at least 2 characters).').max(80, 'The description is too long.'),
  quantity: z.coerce.number('Enter a quantity.').int('Quantity must be a whole number.').min(1, 'Quantity must be at least 1.').max(99, 'Quantity is too large.'),
  unitPrice: z.coerce.number('Enter a price.').positive('The price must be more than 0.').max(10_000_000, 'The price is too high.'),
});

export async function addCharge(bookingId: string, prevState: BillFormState, formData: FormData): Promise<BillFormState> {
  await requireAdmin();

  const parsed = ChargeSchema.safeParse({
    description: formData.get('description') ?? '',
    quantity: formData.get('quantity') || '1',
    unitPrice: formData.get('unitPrice') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the charge.' };
  if (!(await openBooking(bookingId))) return { error: 'This booking was cancelled, so its bill cannot change.' };

  await prisma.$transaction(async (tx) => {
    await tx.bookingCharge.create({ data: { bookingId, ...parsed.data } });
    await recalculateBooking(tx, bookingId);
  });
  revalidateBookings();
  return { saved: Date.now() };
}

export async function removeCharge(chargeId: string) {
  await requireAdmin();

  const charge = await prisma.bookingCharge.findUnique({ where: { id: chargeId } });
  if (!charge || !(await openBooking(charge.bookingId))) return;

  await prisma.$transaction(async (tx) => {
    await tx.bookingCharge.delete({ where: { id: chargeId } });
    await recalculateBooking(tx, charge.bookingId);
  });
  revalidateBookings();
}

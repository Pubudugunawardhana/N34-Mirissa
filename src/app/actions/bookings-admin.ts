'use server';

import type { BookingStatus, PaymentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
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

  await prisma.booking.update({ where: { id: bookingId }, data: { paymentStatus: status } });
  revalidateBookings();
}

const MAX_ROOM_NUMBER_LENGTH = 20;

// Gives the booking its actual room. Confirms a booking that was still waiting; on a confirmed one it just changes the room.
export async function assignRoom(bookingId: string, formData: FormData) {
  await requireAdmin();

  const roomNumber = String(formData.get('roomNumber') ?? '').trim().slice(0, MAX_ROOM_NUMBER_LENGTH);
  // The field is required in the form; an empty value changes nothing.
  if (!roomNumber) return;

  // A cancelled booking has released its room, so it gets neither a number nor a new status.
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.bookingStatus === 'CANCELLED') return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { roomNumber, bookingStatus: 'CONFIRMED' },
  });
  revalidateBookings();
}

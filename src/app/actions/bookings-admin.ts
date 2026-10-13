'use server';

import type { BookingStatus, PaymentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';

const BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED'];
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PARTIAL', 'PAID', 'REFUNDED'];

function revalidateBookings() {
  revalidatePath('/admin/bookings');
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

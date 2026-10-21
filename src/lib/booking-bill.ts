import type { PaymentStatus } from '@prisma/client';
import { nightsBetween, quoteBooking } from '@/lib/booking';
import type prisma from '@/lib/prisma';

// The shared client or a transaction client: only the booking model is needed.
type Db = Pick<typeof prisma, 'booking'>;

// Works out a booking's bill again after its meal plan or extra charges change, inside the caller's transaction:
// room (price when booked × nights) + meals (current plan) + extras. The payment status follows what is still owed.
export async function recalculateBooking(tx: Db, bookingId: string) {
  const booking = await tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { charges: true } });

  const { roomTotal, mealTotal } = quoteBooking({
    pricePerNight: booking.pricePerNight,
    nights: nightsBetween(booking.checkIn, booking.checkOut),
    adults: booking.adults,
    children: booking.children,
    mealPlan: booking.mealPlan,
  });
  const extrasTotal = booking.charges.reduce((sum, charge) => sum + charge.quantity * charge.unitPrice, 0);
  const totalAmount = roomTotal + mealTotal + extrasTotal;

  return tx.booking.update({
    where: { id: bookingId },
    data: { mealTotal, extrasTotal, totalAmount, paymentStatus: paymentStatusFor(booking.amountPaid, totalAmount, booking.paymentStatus) },
  });
}

function paymentStatusFor(amountPaid: number, totalAmount: number, current: PaymentStatus): PaymentStatus {
  // A refund is a decision the hotel made; a new total does not undo it.
  if (current === 'REFUNDED') return current;
  if (amountPaid <= 0) return 'PENDING';
  return amountPaid >= totalAmount ? 'PAID' : 'PARTIAL';
}

export function balanceDue(booking: { totalAmount: number; amountPaid: number }) {
  return Math.max(0, booking.totalAmount - booking.amountPaid);
}

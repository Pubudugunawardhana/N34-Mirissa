import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

// The shared client or the client handed to a transaction callback: both expose the same `booking` model.
type Db = Pick<typeof prisma, 'booking'>;

// A booking holds a room for the nights [checkIn, checkOut): the check-out day itself is free again.
export function overlapping(checkIn: Date, checkOut: Date): Prisma.BookingWhereInput {
  return {
    bookingStatus: { not: 'CANCELLED' },
    checkIn: { lt: checkOut },
    checkOut: { gt: checkIn },
  };
}

// Number of units already taken per room for the given stay.
export async function getBookedCounts(checkIn: Date, checkOut: Date, db: Db = prisma) {
  const groups = await db.booking.groupBy({
    by: ['roomId'],
    where: overlapping(checkIn, checkOut),
    _count: { _all: true },
  });

  return new Map(groups.map((group) => [group.roomId, group._count._all]));
}

export async function getRoomsLeft(
  room: { id: string; quantity: number },
  checkIn: Date,
  checkOut: Date,
  db: Db = prisma,
) {
  const booked = await db.booking.count({
    where: { roomId: room.id, ...overlapping(checkIn, checkOut) },
  });

  return Math.max(0, room.quantity - booked);
}

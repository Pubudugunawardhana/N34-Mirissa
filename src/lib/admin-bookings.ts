import type { Prisma } from '@prisma/client';
import { overlapping } from '@/lib/availability';
import prisma from '@/lib/prisma';

export const BOOKINGS_PER_PAGE = 10;

// What each admin booking screen lists.
export const BOOKING_SCOPES = {
  // Waiting for the hotel to assign a room and confirm.
  new: { bookingStatus: 'PENDING' },
  // A booking moves here once the hotel has dealt with it: given a room (confirmed) or cancelled.
  records: { bookingStatus: { not: 'PENDING' } },
} satisfies Record<string, Prisma.BookingWhereInput>;

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type ListOptions = {
  where: Prisma.BookingWhereInput;
  // Free text matched against the reference, guest name, phone and email.
  search?: string;
  page?: number;
  // Newest first unless a screen needs another order (e.g. in-house guests by departure).
  orderBy?: Prisma.BookingOrderByWithRelationInput;
};

export async function listBookings({ where, search, page = 1, orderBy = { createdAt: 'desc' } }: ListOptions) {
  const term = search?.trim();
  const filter: Prisma.BookingWhereInput = term
    ? {
        AND: [
          where,
          {
            OR: [
              { reference: { contains: term, mode: 'insensitive' } },
              { guestName: { contains: term, mode: 'insensitive' } },
              { phone: { contains: term } },
              { idNumber: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
            ],
          },
        ],
      }
    : where;

  const fetchPage = (pageNumber: number) =>
    prisma.booking.findMany({
      where: filter,
      include: { room: true, charges: { orderBy: { createdAt: 'asc' } }, mealChoices: { orderBy: { meal: 'asc' } } },
      orderBy,
      skip: (pageNumber - 1) * BOOKINGS_PER_PAGE,
      take: BOOKINGS_PER_PAGE,
    });

  // Count and page are fetched together: every query is a long round trip to the database.
  const requested = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1);
  const [total, firstTry] = await Promise.all([prisma.booking.count({ where: filter }), fetchPage(requested)]);

  // A page number past the end (a stale link, or the last row just left the list) shows the last page instead of nothing.
  const pages = Math.max(1, Math.ceil(total / BOOKINGS_PER_PAGE));
  const current = Math.min(requested, pages);
  const rows = current === requested ? firstTry : await fetchPage(current);
  const bookings = await withTakenRooms(rows);

  return { bookings, total, page: current, pages, search: term ?? '' };
}

type ListedBooking = Prisma.BookingGetPayload<{ include: { room: true; charges: true; mealChoices: true } }>;

// Adds, to each booking, the room numbers of its room type that other bookings hold for overlapping nights,
// so the "Assign a room" window can show which rooms are still free. One query for the whole page.
async function withTakenRooms(bookings: ListedBooking[]) {
  const open = bookings.filter((booking) => booking.bookingStatus !== 'CANCELLED');
  const others =
    open.length === 0
      ? []
      : await prisma.booking.findMany({
          where: {
            roomId: { in: [...new Set(open.map((booking) => booking.roomId))] },
            roomNumber: { not: null },
            ...overlapping(
              new Date(Math.min(...open.map((booking) => booking.checkIn.getTime()))),
              new Date(Math.max(...open.map((booking) => booking.checkOut.getTime()))),
            ),
          },
          select: { id: true, roomId: true, roomNumber: true, reference: true, guestName: true, checkIn: true, checkOut: true },
        });

  return bookings.map((booking) => ({
    ...booking,
    taken: others
      .filter(
        (other) =>
          other.id !== booking.id &&
          other.roomId === booking.roomId &&
          other.checkIn < booking.checkOut &&
          other.checkOut > booking.checkIn,
      )
      .map((other) => ({ roomNumber: other.roomNumber!, reference: other.reference, guestName: other.guestName })),
  }));
}

export type BookingListResult = Awaited<ReturnType<typeof listBookings>>;

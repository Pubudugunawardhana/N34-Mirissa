import type { BookingStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { overlapping } from '@/lib/availability';

export const MAX_ROOM_NUMBER_LENGTH = 20;
export const MAX_ROOM_NUMBERS = 500;

// Reads the room-number box of the room form: "101, 102 103" -> ["101", "102", "103"].
export function parseRoomNumbers(text: string) {
  return text
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export type OccupyingBooking = {
  id: string;
  reference: string;
  guestName: string;
  roomNumber: string | null;
  checkIn: Date;
  checkOut: Date;
  bookingStatus: BookingStatus;
};

export type RoomOccupancy = {
  // Room number -> the booking holding it for (part of) the stay.
  taken: Map<string, OccupyingBooking>;
  // Bookings for these dates that the hotel has not given a room number yet.
  unassigned: OccupyingBooking[];
};

// Who holds which room of each room type for the given stay. One query for all the room types.
export async function getOccupancy(roomIds: string[], checkIn: Date, checkOut: Date) {
  const bookings = await prisma.booking.findMany({
    where: { roomId: { in: roomIds }, ...overlapping(checkIn, checkOut) },
    select: { id: true, roomId: true, reference: true, guestName: true, roomNumber: true, checkIn: true, checkOut: true, bookingStatus: true },
    orderBy: { checkIn: 'asc' },
  });

  const byRoom = new Map<string, RoomOccupancy>(roomIds.map((id) => [id, { taken: new Map(), unassigned: [] }]));
  for (const { roomId, ...booking } of bookings) {
    const occupancy = byRoom.get(roomId)!;
    if (booking.roomNumber) {
      // Two bookings on one number for overlapping nights should not happen; the first one found is shown.
      if (!occupancy.taken.has(booking.roomNumber)) occupancy.taken.set(booking.roomNumber, booking);
    } else {
      occupancy.unassigned.push(booking);
    }
  }
  return byRoom;
}

// The booking already holding this room number for overlapping nights, if any.
export function findClash(roomId: string, roomNumber: string, checkIn: Date, checkOut: Date, exceptBookingId: string) {
  return prisma.booking.findFirst({
    where: { roomId, roomNumber, id: { not: exceptBookingId }, ...overlapping(checkIn, checkOut) },
    select: { reference: true, guestName: true },
  });
}

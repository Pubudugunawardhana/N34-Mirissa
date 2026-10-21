import { timingSafeEqual } from 'crypto';

type BookingOwnership = { userId: string | null; guestToken: string | null };
type Viewer = { id: string; role: string } | null | undefined;

function keysMatch(expected: string, given: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Who is looking at a booking: the hotel, the account that made it, or a guest holding its secret key.
export function bookingAccess(booking: BookingOwnership, viewer: Viewer, key: string | null | undefined) {
  if (viewer?.role === 'ADMIN') return 'admin' as const;
  if (viewer && booking.userId && booking.userId === viewer.id) return 'owner' as const;
  if (booking.guestToken && key && keysMatch(booking.guestToken, key)) return 'guest' as const;
  return null;
}

import { randomInt } from 'crypto';
import { Prisma } from '@prisma/client';

// Shared by the guest booking form and the admin walk-in screen.

// No 0/O or 1/I, so a reference read over the phone cannot be mistyped.
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newReference() {
  let code = '';
  for (let i = 0; i < 6; i++) code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `N34-${code}`;
}

// Thrown inside the booking transaction when the last room went in the meantime.
export class SoldOutError extends Error {}

// P2034 = the transaction lost a race and can be retried; P2002 = reference collision.
export function isRetryableBookingError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2034' || error.code === 'P2002');
}

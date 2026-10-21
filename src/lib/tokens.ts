import { createHash, randomBytes } from 'crypto';
import type { AuthTokenType } from '@prisma/client';
import prisma from '@/lib/prisma';

const TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
};

export const RESEND_COOLDOWN_MS = 60 * 1000;

function hashToken(rawToken: string) {
  return createHash('sha256').update(rawToken).digest('hex');
}

// Replaces any earlier token of the same type, so only the newest link works.
export async function createAuthToken(userId: string, type: AuthTokenType) {
  const rawToken = randomBytes(32).toString('hex');

  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, type } }),
    prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]),
      },
    }),
  ]);

  return rawToken;
}

export async function findValidAuthToken(rawToken: string, type: AuthTokenType) {
  if (!rawToken) return null;

  const token = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (!token || token.type !== type || token.expiresAt < new Date()) return null;
  return token;
}

// Single use: returns the user id and deletes the token, or null if it is invalid or expired.
export async function consumeAuthToken(rawToken: string, type: AuthTokenType) {
  const token = await findValidAuthToken(rawToken, type);
  if (!token) return null;

  const { count } = await prisma.authToken.deleteMany({ where: { id: token.id } });
  return count === 1 ? token.userId : null;
}

export async function isInResendCooldown(userId: string, type: AuthTokenType) {
  const latest = await prisma.authToken.findFirst({
    where: { userId, type },
    orderBy: { createdAt: 'desc' },
  });

  return !!latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS;
}

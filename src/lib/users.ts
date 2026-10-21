import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// Emails are stored lower-cased from now on, but older accounts may have mixed case.
export function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
}

// Default staff login, created only while the site has no admin at all.
// These are well-known values: change the password before the site goes live.
export const DEFAULT_ADMIN = { email: 'admin', password: 'admin' };

export async function ensureDefaultAdmin() {
  if ((await prisma.user.count({ where: { role: 'ADMIN' } })) > 0) return;

  await prisma.user.upsert({
    where: { email: DEFAULT_ADMIN.email },
    update: {},
    create: {
      name: 'Admin',
      email: DEFAULT_ADMIN.email,
      password: await bcrypt.hash(DEFAULT_ADMIN.password, 10),
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });
}

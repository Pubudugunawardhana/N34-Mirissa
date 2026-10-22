import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}

// Server actions are public endpoints, so every admin action must call this itself.
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') throw new Error('Not authorised');
  return session.user;
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Alert from '@/components/auth/Alert';
import AuthShell from '@/components/auth/AuthShell';
import prisma from '@/lib/prisma';
import { consumeAuthToken } from '@/lib/tokens';
import { findUserByEmail } from '@/lib/users';

export const metadata: Metadata = { title: 'Verify email | N34 Mirissa' };

type Outcome = 'verified' | 'email-changed' | 'email-taken' | 'invalid';

// One link type serves two cases: confirming a new account, and confirming a new address for an existing one.
async function verifyEmail(rawToken: string): Promise<Outcome> {
  const userId = await consumeAuthToken(rawToken, 'EMAIL_VERIFICATION');
  if (!userId) return 'invalid';

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return 'invalid';

  if (!user.pendingEmail) {
    await prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
    return 'verified';
  }

  // Someone else may have registered the address between the request and this click.
  const owner = await findUserByEmail(user.pendingEmail);
  if (owner && owner.id !== user.id) {
    await prisma.user.update({ where: { id: userId }, data: { pendingEmail: null } });
    return 'email-taken';
  }

  await prisma.user.update({
    where: { id: userId },
    data: { email: user.pendingEmail, pendingEmail: null, emailVerified: new Date() },
  });
  return 'email-changed';
}

export default async function VerifyEmailPage({ searchParams }: PageProps<'/verify-email'>) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';

  const outcome = await verifyEmail(token);
  if (outcome === 'verified') redirect('/login?verified=1');
  // Lands on the profile; a visitor who is not signed in is asked to sign in first and then taken there.
  if (outcome === 'email-changed') redirect('/user?tab=profile&emailChanged=1');

  return (
    <AuthShell title={outcome === 'email-taken' ? 'Email already in use' : 'Verification link not valid'}>
      <div className="space-y-5">
        {outcome === 'email-taken' ? (
          <>
            <Alert>
              Another account registered this email address before the link was opened, so your email has not been changed.
            </Alert>
            <p className="text-sm text-slate-600">
              Your account still uses its previous email. You can choose a different address in your profile settings.
            </p>
          </>
        ) : (
          <>
            <Alert>
              This verification link is invalid, has already been used, or has expired. Links last 24 hours.
            </Alert>
            <p className="text-sm text-slate-600">
              If your email is already verified you can simply sign in. Otherwise, sign in and we will offer to send
              you a fresh link.
            </p>
          </>
        )}
        <Link
          href="/login"
          className="block w-full rounded-lg bg-ocean-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700"
        >
          Go to sign in
        </Link>
      </div>
    </AuthShell>
  );
}

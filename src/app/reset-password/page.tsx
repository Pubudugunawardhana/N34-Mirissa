import type { Metadata } from 'next';
import Link from 'next/link';
import Alert from '@/components/auth/Alert';
import AuthShell from '@/components/auth/AuthShell';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { findValidAuthToken } from '@/lib/tokens';

export const metadata: Metadata = { title: 'Reset password | N34 Mirissa' };

export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';
  const isValid = !!(await findValidAuthToken(token, 'PASSWORD_RESET'));

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={isValid ? 'Pick something you have not used before.' : undefined}
      footer={
        <Link href="/login" className="font-semibold text-ocean-600 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {isValid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-5">
          <Alert>This reset link is invalid or has expired. Reset links work once and last 1 hour.</Alert>
          <Link
            href="/forgot-password"
            className="block w-full rounded-lg bg-ocean-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700"
          >
            Request a new link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}

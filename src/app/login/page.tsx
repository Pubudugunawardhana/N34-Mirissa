import type { Metadata } from 'next';
import Link from 'next/link';
import Alert from '@/components/auth/Alert';
import AuthShell from '@/components/auth/AuthShell';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Sign in | N34 Mirissa' };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  const callbackUrl = first(params.callbackUrl);

  return (
    <AuthShell
      title="Sign in to your account"
      subtitle="Welcome back to N34 Mirissa"
      footer={
        <>
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-ocean-600 hover:underline">
              Create one
            </Link>
          </p>
          <p className="mt-3">
            <Link href="/" className="text-slate-500 hover:text-ocean-600 hover:underline">
              Continue as guest
            </Link>
          </p>
        </>
      }
    >
      <div className="space-y-5">
        {first(params.verified) && (
          <Alert variant="success">Your email is verified. You can sign in now.</Alert>
        )}
        {first(params.reset) && (
          <Alert variant="success">Your password has been changed. Sign in with your new password.</Alert>
        )}
        {callbackUrl && !first(params.verified) && !first(params.reset) && (
          <Alert variant="info">Please sign in to continue.</Alert>
        )}
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </AuthShell>
  );
}

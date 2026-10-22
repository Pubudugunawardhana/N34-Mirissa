'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { requestPasswordReset, type ForgotPasswordState } from '@/app/actions/password-reset';
import Alert from '@/components/auth/Alert';
import AuthShell from '@/components/auth/AuthShell';
import Field from '@/components/auth/Field';
import SubmitButton from '@/components/auth/SubmitButton';

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to choose a new one."
      footer={
        <Link href="/login" className="font-semibold text-ocean-600 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {state.success ? (
        <Alert variant="success">
          {state.message} The link expires in 1 hour. Check your spam folder if it does not arrive.
        </Alert>
      ) : (
        <form className="space-y-5" action={formAction} noValidate>
          {state.message && <Alert>{state.message}</Alert>}

          <Field
            id="email"
            name="email"
            type="email"
            label="Email address"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />

          <SubmitButton pending={isPending} pendingLabel="Sending link...">
            Send reset link
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}

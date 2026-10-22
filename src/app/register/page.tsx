'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerUser, type RegisterState } from '@/app/actions/register';
import Alert from '@/components/auth/Alert';
import AuthShell from '@/components/auth/AuthShell';
import Field from '@/components/auth/Field';
import PasswordInput from '@/components/auth/PasswordInput';
import ResendVerification from '@/components/auth/ResendVerification';
import SubmitButton from '@/components/auth/SubmitButton';

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerUser, initialState);

  if (state.success && state.email) {
    return (
      <AuthShell title="Check your inbox" subtitle="One more step to finish setting up your account">
        <div className="space-y-5">
          <Alert variant="success">
            {state.message} We sent a verification link to <strong>{state.email}</strong>. It expires in 24 hours.
          </Alert>
          <p className="text-sm text-slate-600">
            {state.verificationRequired
              ? 'Open the link in that email to activate your account, then sign in.'
              : 'You can sign in right away. Opening the link confirms your email address.'}
          </p>
          {state.linkInConsole && (
            <Alert variant="info">
              Email sending is not set up on this computer yet, so no message was delivered. The verification link is printed in the server terminal.
            </Alert>
          )}
          <Link
            href="/login"
            className="block w-full rounded-lg bg-ocean-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700"
          >
            Go to sign in
          </Link>
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">Didn&apos;t get the email?</p>
            <ResendVerification email={state.email} />
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create an account"
      subtitle="Join N34 Mirissa for exclusive experiences"
      footer={
        <>
          <p>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-ocean-600 hover:underline">
              Sign in
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
      <form className="space-y-5" action={formAction} noValidate>
        {state.message && <Alert>{state.message}</Alert>}

        <Field
          id="name"
          name="name"
          type="text"
          label="Full name"
          autoComplete="name"
          placeholder="Your full name"
          defaultValue={state.values?.name}
          error={state.errors?.name?.[0]}
          required
        />
        <Field
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          error={state.errors?.email?.[0]}
          required
        />
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters, with a letter and a number"
          error={state.errors?.password?.[0]}
          showStrength
          required
        />
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={state.errors?.confirmPassword?.[0]}
          required
        />

        <SubmitButton pending={isPending} pendingLabel="Creating account...">
          Create account
        </SubmitButton>
      </form>
    </AuthShell>
  );
}

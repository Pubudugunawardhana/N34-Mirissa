'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { authenticate, type LoginState } from '@/app/actions/auth';
import Alert from './Alert';
import Field from './Field';
import PasswordInput from './PasswordInput';
import ResendVerification from './ResendVerification';
import SubmitButton from './SubmitButton';

const initialState: LoginState = {};

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, isPending] = useActionState(authenticate, initialState);

  return (
    <div className="space-y-5">
      {/* Kept outside the form below: the resend button is a form of its own. */}
      {state.message && (
        <Alert>
          {state.message}
          {state.code === 'unverified' && state.email && (
            <div className="mt-2">
              <ResendVerification email={state.email} />
            </div>
          )}
        </Alert>
      )}

      <form className="space-y-5" action={formAction} noValidate>
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

        <Field
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          required
        />

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          required
          labelAction={
            <Link href="/forgot-password" className="text-sm font-medium text-ocean-600 hover:text-ocean-800 hover:underline">
              Forgot password?
            </Link>
          }
        />

        <SubmitButton pending={isPending} pendingLabel="Signing in...">
          Sign in
        </SubmitButton>
      </form>
    </div>
  );
}

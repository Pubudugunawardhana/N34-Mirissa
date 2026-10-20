'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { resetPassword, type ResetPasswordState } from '@/app/actions/password-reset';
import Alert from './Alert';
import PasswordInput from './PasswordInput';
import SubmitButton from './SubmitButton';

const initialState: ResetPasswordState = {};

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPassword, initialState);

  if (state.expired) {
    return (
      <div className="space-y-5">
        <Alert>{state.message}</Alert>
        <Link href="/forgot-password" className="block text-center text-sm font-semibold text-ocean-600 hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" action={formAction} noValidate>
      <input type="hidden" name="token" value={token} />

      {state.message && <Alert>{state.message}</Alert>}

      <PasswordInput
        id="password"
        name="password"
        label="New password"
        autoComplete="new-password"
        placeholder="At least 8 characters, with a letter and a number"
        error={state.errors?.password?.[0]}
        showStrength
        required
      />
      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        placeholder="Repeat your new password"
        error={state.errors?.confirmPassword?.[0]}
        required
      />

      <SubmitButton pending={isPending} pendingLabel="Saving...">
        Change password
      </SubmitButton>
    </form>
  );
}

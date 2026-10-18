'use client';

import { useActionState } from 'react';
import { authenticateAdmin, type LoginState } from '@/app/actions/auth';
import Alert from './Alert';
import Field from './Field';
import PasswordInput from './PasswordInput';
import SubmitButton from './SubmitButton';

const initialState: LoginState = {};

export default function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(authenticateAdmin, initialState);

  return (
    <form className="space-y-5" action={formAction} noValidate>
      {state.message && <Alert>{state.message}</Alert>}

      <Field
        id="email"
        name="email"
        type="text"
        label="Admin email or username"
        autoComplete="username"
        autoCapitalize="none"
        placeholder="admin"
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
      />

      <SubmitButton pending={isPending} pendingLabel="Signing in...">
        Sign in to admin panel
      </SubmitButton>
    </form>
  );
}

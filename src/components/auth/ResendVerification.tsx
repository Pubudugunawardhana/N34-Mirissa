'use client';

import { useActionState } from 'react';
import { resendVerification, type ResendState } from '@/app/actions/verification';

const initialState: ResendState = {};

export default function ResendVerification({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(resendVerification, initialState);

  return (
    <form action={formAction} className="text-sm">
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={isPending}
        className="font-semibold text-ocean-600 hover:text-ocean-800 hover:underline disabled:opacity-60"
      >
        {isPending ? 'Sending...' : 'Resend verification email'}
      </button>
      {state.message && (
        <p className={`mt-1.5 text-xs ${state.success ? 'text-green-700' : 'text-red-600'}`} aria-live="polite">
          {state.message}
        </p>
      )}
    </form>
  );
}

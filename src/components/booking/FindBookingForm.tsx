'use client';

import { useActionState, useState } from 'react';
import { findBooking, type FindBookingState } from '@/app/actions/book';
import Alert from '@/components/auth/Alert';
import Field from '@/components/auth/Field';
import SubmitButton from '@/components/auth/SubmitButton';

const initialState: FindBookingState = {};

export default function FindBookingForm() {
  const [state, formAction, isPending] = useActionState(findBooking, initialState);

  // Controlled, so what was typed stays put when the booking is not found.
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && <Alert>{state.message}</Alert>}

      <Field
        id="find-reference"
        name="reference"
        label="Booking reference"
        placeholder="N34-ABC123"
        autoCapitalize="characters"
        autoComplete="off"
        value={reference}
        onChange={(event) => setReference(event.target.value)}
        required
      />
      <Field
        id="find-email"
        name="email"
        type="email"
        label="Email used for the booking"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <SubmitButton pending={isPending} pendingLabel="Searching...">
        Find my booking
      </SubmitButton>
    </form>
  );
}

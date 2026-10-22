'use client';

import { useActionState, useState } from 'react';
import { submitContactMessage, type ContactFormState } from '@/app/actions/contact';
import Alert from '@/components/auth/Alert';
import Field, { FieldError, inputClass } from '@/components/auth/Field';
import SubmitButton from '@/components/auth/SubmitButton';

const initialState: ContactFormState = {};

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactForm({ initial }: { initial: { name: string; email: string; phone: string } }) {
  const [state, formAction, isPending] = useActionState(submitContactMessage, initialState);

  // Controlled, so nothing typed is lost when the server sends back an error.
  const [values, setValues] = useState({ ...EMPTY, ...initial });
  const [consent, setConsent] = useState(false);
  // A sent message is acknowledged until the visitor starts another one. Remembering which
  // result was dismissed (not just "dismissed") lets the next successful send show again.
  const [dismissed, setDismissed] = useState<ContactFormState | null>(null);

  const set = (field: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  if (state.success && state !== dismissed) {
    return (
      <div className="py-8 text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h3 className="font-display text-2xl font-semibold text-ocean-900">Message sent</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600" role="status">{state.message}</p>
        <button
          type="button"
          onClick={() => {
            setValues((current) => ({ ...current, subject: '', message: '' }));
            setConsent(false);
            setDismissed(state);
          }}
          className="mt-6 text-sm font-semibold text-ocean-600 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && !state.success && <Alert>{state.message}</Alert>}

      <Field id="contact-name" name="name" label="Name" autoComplete="name" value={values.name} onChange={set('name')} error={state.errors?.name?.[0]} required />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="contact-email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={set('email')}
          error={state.errors?.email?.[0]}
          required
        />
        <Field
          id="contact-phone"
          name="phone"
          type="tel"
          label="Phone (optional)"
          autoComplete="tel"
          placeholder="071 234 5678"
          value={values.phone}
          onChange={set('phone')}
          error={state.errors?.phone?.[0]}
        />
      </div>

      <Field
        id="contact-subject"
        name="subject"
        label="Subject"
        placeholder="Booking enquiry"
        value={values.subject}
        onChange={set('subject')}
        error={state.errors?.subject?.[0]}
        required
      />

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-slate-700">Message</label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          placeholder="How can we help you?"
          value={values.message}
          onChange={set('message')}
          aria-invalid={state.errors?.message ? true : undefined}
          className={inputClass}
          required
        />
        <FieldError id="contact-message" error={state.errors?.message?.[0]} />
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-ocean-600"
          />
          <span>I agree that N34 Mirissa may store the details above to reply to my message.</span>
        </label>
        <FieldError id="contact-consent" error={state.errors?.consent?.[0]} />
      </div>

      <div className="sm:w-56">
        <SubmitButton pending={isPending} pendingLabel="Sending...">
          Send message
        </SubmitButton>
      </div>
    </form>
  );
}

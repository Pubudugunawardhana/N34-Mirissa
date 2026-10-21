'use client';

import { useActionState, useId, useRef } from 'react';
import type { DiningRequestState } from '@/app/actions/dining-request';

const initialState: DiningRequestState = {};
const fieldClass =
  'block h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

function FieldError({ state, name }: { state: DiningRequestState; name: string }) {
  const error = state.errors?.[name]?.[0];
  return error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null;
}

// "Request" on a special dinner: a small window asking when, for how many, and how to reach the guest.
export default function ExperienceRequestButton({
  action,
  title,
  today,
}: {
  action: (prevState: DiningRequestState, formData: FormData) => Promise<DiningRequestState>;
  title: string;
  today: string;
}) {
  const [state, formAction, sending] = useActionState(action, initialState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-full bg-sand-500 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-md shadow-sand-500/25 transition-colors hover:bg-sand-600"
      >
        Request
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl bg-transparent p-0 text-left font-sans text-base font-normal normal-case tracking-normal backdrop:bg-ocean-900/60 backdrop:backdrop-blur-sm"
      >
        <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-ocean-900/30 ring-1 ring-slate-200 sm:p-8">
          <span className="block text-xs font-medium uppercase tracking-[0.3em] text-sand-600">Request</span>
          <h2 id={`${id}-title`} className="mt-2 font-display text-2xl font-semibold text-ocean-900">{title}</h2>

          {state.sent ? (
            <div role="status" className="mt-6 space-y-5">
              <p className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm leading-relaxed text-emerald-700 ring-1 ring-inset ring-emerald-200">
                Request sent. We will reply by email to confirm the details.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="h-11 rounded-xl bg-ocean-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-ocean-700"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form action={formAction} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor={`${id}-name`}>Your name</label>
                  <input id={`${id}-name`} name="name" required autoComplete="name" className={fieldClass} />
                  <FieldError state={state} name="name" />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`${id}-email`}>Email</label>
                  <input id={`${id}-email`} name="email" type="email" required autoComplete="email" className={fieldClass} />
                  <FieldError state={state} name="email" />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`${id}-phone`}>
                    Phone <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" className={fieldClass} />
                  <FieldError state={state} name="phone" />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`${id}-date`}>Preferred date</label>
                  <input id={`${id}-date`} name="date" type="date" min={today} required className={fieldClass} />
                  <FieldError state={state} name="date" />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`${id}-guests`}>Guests</label>
                  <input id={`${id}-guests`} name="guests" type="number" min="1" max="40" defaultValue="2" required className={fieldClass} />
                  <FieldError state={state} name="guests" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor={`${id}-note`}>
                    Anything we should know? <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id={`${id}-note`}
                    name="note"
                    rows={3}
                    maxLength={1000}
                    placeholder="An anniversary, food allergies, a time you prefer…"
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20"
                  />
                  <FieldError state={state} name="note" />
                </div>
              </div>
              {state.error && <p role="alert" className="text-sm font-medium text-red-600">{state.error}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="h-11 rounded-xl bg-ocean-600 px-6 text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700 disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

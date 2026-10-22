'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { ReplyFormState } from '@/app/actions/messages';

const initialState: ReplyFormState = {};

// Writes and sends the hotel's answer. The box clears once it has gone.
export default function MessageReplyForm({
  action,
  guestName,
  email,
  hasReply,
}: {
  action: (prevState: ReplyFormState, formData: FormData) => Promise<ReplyFormState>;
  guestName: string;
  email: string;
  hasReply: boolean;
}) {
  const [state, formAction, sending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state.saved]);

  return (
    <form ref={formRef} action={formAction} className="rounded-2xl border border-slate-200 bg-white p-4 focus-within:border-ocean-400">
      <label htmlFor="reply" className="text-sm font-medium text-slate-700">
        {hasReply ? 'Send another reply' : `Reply to ${guestName}`}
      </label>
      <textarea
        id="reply"
        name="reply"
        rows={5}
        maxLength={4000}
        required
        placeholder={`Hello ${guestName.split(' ')[0]}, thank you for your message…`}
        className="mt-2 block w-full resize-y rounded-xl border-0 bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-ocean-500/20"
      />
      {state.error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200">
          Reply sent to {email}.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">Sent by email to {email}</p>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-ocean-600 px-5 text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
          {sending ? 'Sending…' : 'Send reply'}
        </button>
      </div>
    </form>
  );
}

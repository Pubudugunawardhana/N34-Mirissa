'use client';

import { useEffect, useId, useRef } from 'react';
import { useFormStatus } from 'react-dom';

type ConfirmSubmitButtonProps = {
  // What will happen, shown under the title.
  confirmMessage: string;
  title?: string;
  // The button that goes ahead, and the one that backs out.
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
  children: React.ReactNode;
};

// Button for destructive forms. It opens a confirmation dialog; only the dialog's red button submits the form.
// Must be rendered inside the <form> it belongs to.
export default function ConfirmSubmitButton({
  confirmMessage,
  title = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  className,
  children,
}: ConfirmSubmitButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
  const { pending } = useFormStatus();

  // Close once the action has finished (the row often disappears with it, but not always).
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) dialogRef.current?.close();
    wasPending.current = pending;
  }, [pending]);

  return (
    <>
      <button type="button" className={className} onClick={() => dialogRef.current?.showModal()}>
        {children}
      </button>

      {/* A native modal dialog: the page behind cannot be used, focus stays inside, and Esc closes it. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={messageId}
        // A click on the dimmed area lands on the dialog element itself, not on its content.
        onClick={(event) => {
          if (event.target === event.currentTarget && !pending) event.currentTarget.close();
        }}
        // While the action runs, Esc must not dismiss the dialog.
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-transparent p-0 text-left font-sans text-base font-normal normal-case tracking-normal backdrop:bg-ocean-900/60 backdrop:backdrop-blur-sm"
      >
        <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-ocean-900/30 ring-1 ring-slate-200 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v4M12 17h.01M10.3 3.9L2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
          </span>

          <h2 id={titleId} className="mt-5 font-display text-xl font-semibold text-ocean-900">{title}</h2>
          <p id={messageId} className="mt-2 text-sm leading-relaxed text-slate-600">{confirmMessage}</p>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {/* First in tab order and focused on opening, so a stray Enter does nothing destructive. */}
            <button
              type="button"
              autoFocus
              disabled={pending}
              onClick={() => dialogRef.current?.close()}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-md shadow-red-600/20 transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:opacity-70"
            >
              {pending ? 'Working…' : confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const TYPING_PAUSE_MS = 300;

type BookingSearchProps = {
  // The screen's own address and any other filters to keep (e.g. the status chip).
  basePath: string;
  keep: Record<string, string>;
  initial: string;
  // Also used for the admin messages list.
  placeholder?: string;
  label?: string;
};

// Search box that updates the list as you type. The list itself is still rendered on the server from ?q=,
// so a search can be bookmarked or shared, and Enter still works without JavaScript.
export default function BookingSearch({
  basePath,
  keep,
  initial,
  placeholder = 'Search reference, name, phone or email',
  label = 'Search bookings',
}: BookingSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function search(text: string) {
    const query = new URLSearchParams(keep);
    if (text.trim()) query.set('q', text.trim());
    const target = query.toString() ? `${basePath}?${query}` : basePath;
    // replace, not push: every keystroke should not become a Back-button step. A new search starts on page 1.
    startTransition(() => router.replace(target, { scroll: false }));
  }

  // Waits for a short pause in typing, so the server is not asked once per letter.
  function onChange(text: string) {
    setValue(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(text), TYPING_PAUSE_MS);
  }

  return (
    <form
      action={basePath}
      onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        search(value);
      }}
      role="search"
      // Read by the booking list, which fades while new results are on their way.
      data-search-pending={isPending || undefined}
      className="relative w-80 max-w-full"
    >
      {Object.entries(keep).map(([key, keepValue]) => (
        <input key={key} type="hidden" name={key} value={keepValue} />
      ))}

      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>

      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20"
      />

      {/* Shown while the new results are on their way. */}
      {isPending && (
        <svg className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ocean-600" viewBox="0 0 24 24" fill="none" aria-label="Searching">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </form>
  );
}

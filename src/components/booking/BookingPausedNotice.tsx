import Link from 'next/link';
import type { SiteSettings } from '@/lib/hotel';

type Props = { site: SiteSettings; variant?: 'banner' | 'card' };

// Shown while the hotel has paused online booking: the admin's message and how to book instead.
export default function BookingPausedNotice({ site, variant = 'banner' }: Props) {
  const phoneHref = `tel:${site.phone.replace(/[^+\d]/g, '')}`;
  const actions = (
    <div className={`flex flex-wrap gap-3 ${variant === 'card' ? 'justify-center' : ''}`}>
      <a href={phoneHref} className="inline-flex h-11 items-center gap-2 rounded-full bg-ocean-600 px-5 text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 4h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
        </svg>
        Call {site.phone}
      </a>
      {site.social.whatsapp && (
        <a
          href={site.social.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 text-sm font-semibold text-emerald-700 transition-colors hover:border-emerald-400"
        >
          WhatsApp us
        </a>
      )}
      {variant === 'card' && (
        <Link href="/rooms" className="inline-flex h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700">
          Back to rooms
        </Link>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-xl shadow-ocean-900/5 sm:p-10" data-booking-paused>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sand-50 text-sand-600">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18M10 14v4M14 14v4" />
          </svg>
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-ocean-900">Online booking is paused</h2>
        <p className="mt-3 leading-relaxed text-slate-600">{site.bookingsPausedMessage}</p>
        <div className="mt-7">{actions}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-sand-200 bg-sand-50 px-5 py-4" role="status" data-booking-paused>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ocean-900">Online booking is paused</p>
        <p className="mt-0.5 text-sm text-slate-600">{site.bookingsPausedMessage}</p>
      </div>
      {actions}
    </div>
  );
}

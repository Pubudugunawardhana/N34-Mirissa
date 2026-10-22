import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';

export const metadata: Metadata = { title: 'Page not found | N34 Mirissa' };

// Shown for any address that does not exist, and for rooms or bookings that are gone or not yours to see.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav variant="solid" />

      <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 pb-20 pt-36 text-center sm:px-6">
        <span className="block text-xs font-medium uppercase tracking-[0.3em] text-sand-600">Error 404</span>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ocean-900 md:text-5xl">Page not found</h1>
        <p className="mt-4 leading-relaxed text-slate-600">
          The page you are looking for does not exist, or it has been moved or removed. If you followed a link to a room,
          that room may no longer be offered.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/rooms#rooms"
            className="flex h-12 items-center rounded-xl bg-sand-500 px-6 text-sm font-semibold text-white shadow-md shadow-sand-500/25 transition-colors hover:bg-sand-600"
          >
            See our rooms
          </Link>
          <Link
            href="/"
            className="flex h-12 items-center rounded-xl border border-slate-200 px-6 text-sm font-semibold text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700"
          >
            Back to home
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

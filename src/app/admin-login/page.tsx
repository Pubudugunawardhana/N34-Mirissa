import type { Metadata } from 'next';
import Link from 'next/link';
import AdminLoginForm from '@/components/auth/AdminLoginForm';

export const metadata: Metadata = {
  title: 'Admin sign in | N34 Mirissa',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="theme-fixed relative flex min-h-screen items-center justify-center overflow-hidden bg-ocean-900 px-4 py-12 text-slate-900">
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-ocean-600/30 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-sand-500/15 blur-3xl" aria-hidden="true" />

      <main className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-wide text-white">N34</span>
            <span className="text-sm font-medium uppercase tracking-[0.25em] text-sand-200">Admin</span>
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-black/30 sm:p-10">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ocean-50 text-ocean-700">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
              <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ocean-900">Staff sign in</h1>
          <p className="mt-2 text-sm text-slate-500">For hotel staff only. Guests can sign in from the main site.</p>

          <div className="mt-8">
            <AdminLoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/" className="transition-colors hover:text-white">← Back to the website</Link>
          <span className="mx-3 text-slate-600" aria-hidden="true">·</span>
          <Link href="/login" className="transition-colors hover:text-white">Guest sign in</Link>
        </p>
      </main>
    </div>
  );
}

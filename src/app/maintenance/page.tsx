import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import SocialIcons from '@/components/SocialIcons';
import { getSiteSettings } from '@/lib/hotel';

export const metadata: Metadata = { title: 'We’ll be back soon | N34 Mirissa', robots: { index: false } };
export const dynamic = 'force-dynamic';

const socialClass =
  'flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-sand-200 hover:bg-white/10 hover:text-white';

// What visitors see while the admin has the website in maintenance mode (the proxy sends them here).
export default async function MaintenancePage() {
  const site = await getSiteSettings();
  if (!site.maintenance) redirect('/');

  return (
    <main className="theme-fixed relative flex min-h-screen items-center justify-center overflow-hidden bg-ocean-900 px-4 py-16 text-white">
      <Image src="/images/hero-1.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ocean-900/75 via-ocean-900/60 to-ocean-900/85" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <p className="flex items-baseline justify-center gap-2">
          <span className="font-display text-4xl font-bold tracking-wide">N34</span>
          <span className="text-sm font-medium uppercase tracking-[0.3em] text-sand-200">Mirissa</span>
        </p>

        <span className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur">
          <svg className="h-8 w-8 text-sand-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z" />
          </svg>
        </span>

        <h1 className="mt-6 font-display text-4xl font-semibold drop-shadow-lg md:text-5xl">We’ll be back soon</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg font-light leading-relaxed text-slate-200">{site.maintenanceMessage}</p>

        <div className="mx-auto mt-10 grid max-w-lg gap-3 sm:grid-cols-2">
          <a href={`tel:${site.phone.replace(/[^+\d]/g, '')}`} className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/15">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-sand-200">Call us</span>
            <span className="mt-1 block font-medium">{site.phone}</span>
          </a>
          <a href={`mailto:${site.email}`} className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/15">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-sand-200">Email</span>
            <span className="mt-1 block break-all font-medium">{site.email}</span>
          </a>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <SocialIcons links={site.social} className={socialClass} />
        </div>
      </div>
    </main>
  );
}

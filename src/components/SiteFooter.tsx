import Link from 'next/link';
import SocialIcons, { hasSocialLinks } from '@/components/SocialIcons';
import { getSiteSettings } from '@/lib/hotel';

// The short line about the hotel under the logo.
const FALLBACK = {
  about: 'A serene beachfront getaway on the Mirissa coast, where the ocean breeze meets luxury comfort.',
};

const EXPLORE_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/rooms', label: 'Rooms' },
  { href: '/experiences', label: 'Experiences' },
  { href: '/dining', label: 'Dining' },
  { href: '/weddings', label: 'Weddings' },
  { href: '/contact', label: 'Contact' },
];

const GUEST_LINKS = [
  { href: '/rooms', label: 'Book a room' },
  { href: '/book/find', label: 'Find my booking' },
  { href: '/user', label: 'My account' },
  { href: '/login', label: 'Sign in' },
  { href: '/register', label: 'Create account' },
];

const headingClass = 'mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-sand-200';
const iconClass = 'mt-0.5 h-4 w-4 shrink-0 text-ocean-400';
const socialClass =
  'flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-slate-300 transition-colors hover:border-sand-200 hover:bg-white/5 hover:text-white';

function FooterLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <ul className="space-y-3 text-sm">
      {links.map((link) => (
        <li key={link.label}>
          <Link href={link.href} className="group relative inline-block text-slate-300 transition-colors hover:text-white">
            {link.label}
            <span
              className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-sand-200 transition-transform duration-300 group-hover:scale-x-100"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function SiteFooter() {
  const site = await getSiteSettings();
  const { phone, email } = site;

  return (
    <footer>
      <div className="theme-fixed bg-ocean-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 pt-16 pb-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
            <div>
              <Link href="/" className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold tracking-wide text-white">N34</span>
                <span className="text-sm font-medium uppercase tracking-[0.25em] text-sand-200">Mirissa</span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">{FALLBACK.about}</p>

              {hasSocialLinks(site.social) && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <SocialIcons links={site.social} className={socialClass} iconClassName="h-4 w-4" />
                </div>
              )}
            </div>

            <nav aria-label="Explore">
              <h2 className={headingClass}>Explore</h2>
              <FooterLinks links={EXPLORE_LINKS} />
            </nav>

            <nav aria-label="Guests">
              <h2 className={headingClass}>Guests</h2>
              <FooterLinks links={GUEST_LINKS} />
            </nav>

            <div>
              <h2 className={headingClass}>Contact</h2>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                  <span>{site.address}</span>
                </li>
                <li className="flex gap-3">
                  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 4h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
                  </svg>
                  <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="transition-colors hover:text-white">{phone}</a>
                </li>
                <li className="flex gap-3">
                  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" />
                    <path d="M3.5 7.5l8.5 6 8.5-6" />
                  </svg>
                  <a href={`mailto:${email}`} className="break-all transition-colors hover:text-white">{email}</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-slate-400 sm:flex-row">
            <p className="text-center sm:text-left">
              © {new Date().getFullYear()} N34 Mirissa. All rights reserved.
              <span className="mx-2 text-slate-600" aria-hidden="true">·</span>
              Designed &amp; developed by{' '}
              <a
                href="https://github.com/Pubudugunawardhana"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sand-200 transition-colors hover:text-white"
              >
                Pubudu Gunawardhana
              </a>
            </p>
            <div className="flex items-center gap-5">
              {/* Staff shortcut, kept dim on purpose. The admin panel itself is protected by the role check. */}
              <Link
                href="/admin"
                prefetch={false}
                className="text-slate-600 transition-colors hover:text-slate-300 focus-visible:text-slate-300"
              >
                Admin
              </Link>
              <a href="#" className="font-medium transition-colors hover:text-white">Back to top ↑</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import ThemeToggle from './ThemeToggle';
import UserAvatar from './UserAvatar';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/rooms', label: 'Rooms' },
  { href: '/experiences', label: 'Experiences' },
  { href: '/dining', label: 'Dining' },
  { href: '/contact', label: 'Contact' },
];

type SiteNavBarProps = {
  user: { name?: string | null; image?: string | null; role: string } | null;
  // "overlay" starts transparent over a hero photo and turns solid once the page scrolls.
  variant?: 'overlay' | 'solid';
};

export default function SiteNavBar({ user, variant = 'overlay' }: SiteNavBarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = variant === 'solid' || scrolled || menuOpen;
  const accountHref = user?.role === 'ADMIN' ? '/admin' : '/user';
  const accountLabel = user?.role === 'ADMIN' ? 'Admin Panel' : 'My Account';

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        className={`mx-auto max-w-7xl rounded-2xl border transition-all duration-300 ${
          solid
            ? 'border-slate-200/70 bg-white/85 text-slate-700 shadow-lg shadow-ocean-900/5 backdrop-blur-xl'
            : 'border-white/15 bg-white/5 text-white backdrop-blur-sm'
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-baseline gap-2" onClick={() => setMenuOpen(false)}>
            <span className={`font-display text-2xl font-bold tracking-wide ${solid ? 'text-ocean-800' : 'text-white'}`}>N34</span>
            <span className={`text-sm font-medium uppercase tracking-[0.25em] ${solid ? 'text-ocean-600' : 'text-sand-200'}`}>Mirissa</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    solid ? 'hover:text-ocean-600' : 'hover:text-white'
                  } ${isActive ? (solid ? 'text-ocean-700' : 'text-white') : solid ? 'text-slate-600' : 'text-white/80'}`}
                >
                  {link.label}
                  <span
                    className={`absolute inset-x-4 -bottom-0.5 h-0.5 origin-left rounded-full transition-transform duration-300 group-hover:scale-x-100 ${
                      solid ? 'bg-ocean-600' : 'bg-sand-200'
                    } ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className={solid ? 'text-slate-600 hover:bg-slate-100' : 'text-white hover:bg-white/10'} />

            <div className="hidden items-center gap-2 sm:flex">
              {user ? (
                <>
                  <Link
                    href={accountHref}
                    className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-4 text-sm font-medium transition-colors ${
                      solid ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                    }`}
                  >
                    <UserAvatar name={user.name} image={user.image} pixels={32} />
                    {accountLabel}
                  </Link>
                  <form action={logout}>
                    <button
                      className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                        solid ? 'text-slate-500 hover:text-ocean-600' : 'text-white/80 hover:text-white'
                      }`}
                    >
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/register"
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    solid
                      ? 'border-ocean-600/30 text-ocean-700 hover:bg-ocean-50'
                      : 'border-white/40 hover:bg-white/15'
                  }`}
                >
                  Sign Up
                </Link>
              )}
            </div>

            {/* Lands on the availability search and room list, past the photo. */}
            <Link
              href="/rooms#rooms"
              className="rounded-full bg-sand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sand-500/30 transition-all hover:bg-sand-600 hover:shadow-lg"
            >
              Book Now
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden ${
                solid ? 'hover:bg-slate-100' : 'hover:bg-white/10'
              }`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200/70 px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-ocean-50 hover:text-ocean-700"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200/70 pt-3 sm:hidden">
              {user ? (
                <>
                  <Link
                    href={accountHref}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-ocean-50 hover:text-ocean-700"
                  >
                    {accountLabel}
                  </Link>
                  <form action={logout}>
                    <button className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-500 hover:bg-slate-100">
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/register"
                  className="rounded-full bg-ocean-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-ocean-700"
                >
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

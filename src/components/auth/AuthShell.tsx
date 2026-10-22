import Link from 'next/link';
import PhotoSlideshow from '@/components/PhotoSlideshow';

const SLIDES = [
  '/images/auth-beach-1.jpg',
  '/images/auth-beach-2.jpg',
  '/images/auth-beach-3.jpg',
  '/images/auth-beach-4.jpg',
  '/images/auth-beach-5.jpg',
];

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white text-slate-900">
      {/* Brand panel */}
      <aside className="theme-fixed relative hidden lg:flex flex-col justify-between overflow-hidden bg-ocean-900 p-12 text-white">
        <PhotoSlideshow slides={SLIDES} sizes="50vw" />
        {/* Darkens the photos so the white text stays readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-900/85 via-ocean-900/55 to-ocean-900/50" aria-hidden="true" />

        <Link href="/" className="relative flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-wider">N34</span>
          <span className="text-xl font-light text-ocean-400">Mirissa</span>
        </Link>

        <div className="relative max-w-md">
          <span className="text-sand-200 font-medium tracking-[0.2em] uppercase text-xs mb-4 block">
            Welcome to Paradise
          </span>
          <p className="font-display text-4xl font-semibold leading-tight">
            Where the ocean breeze meets luxury comfort.
          </p>
          <p className="mt-4 text-slate-200 font-light leading-relaxed">
            Sign in to manage your bookings, leave reviews and plan your next stay on the Mirissa coast.
          </p>
        </div>

        <p className="relative text-xs text-slate-300">© {new Date().getFullYear()} N34 Mirissa</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center px-4 py-12 sm:px-8 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-md mx-auto">
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <span className="font-display text-2xl font-bold text-ocean-800 tracking-wider">N34</span>
            <span className="text-xl font-light text-ocean-600">Mirissa</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-ocean-900 tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';
import { auth } from '@/auth';
import { getSiteSettings } from '@/lib/hotel';
import SiteNavBar from './SiteNavBar';

export default async function SiteNav({ variant }: { variant?: 'overlay' | 'solid' }) {
  const session = await auth();
  const user = session?.user ? { name: session.user.name, image: session.user.image, role: session.user.role } : null;
  // Only staff are told when the site is offline for visitors; everyone else is already on the maintenance page.
  const site = user?.role === 'ADMIN' ? await getSiteSettings() : null;
  const notices = [
    site?.maintenance && 'Maintenance mode is on: visitors see the maintenance page.',
    site?.bookingsPaused && 'Online booking is paused.',
  ].filter(Boolean);

  return (
    <>
      <SiteNavBar user={user} variant={variant} />
      {notices.length > 0 && (
        <div className="theme-fixed fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 print:hidden" role="status">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-white shadow-xl shadow-amber-900/20">
            <span>{notices.join(' ')}</span>
            <Link href="/admin/settings" className="font-semibold underline underline-offset-2">
              Site Settings
            </Link>
          </p>
        </div>
      )}
    </>
  );
}

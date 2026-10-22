import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import AdminClock from "@/components/admin/AdminClock";
import ThemeToggle from "@/components/ThemeToggle";
import { BOOKING_SCOPES } from "@/lib/admin-bookings";
import { getSiteSettings } from "@/lib/hotel";
import prisma from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The sidebar count is fetched alongside the session check: each query is a long round trip to the database.
  const [session, newBookings, site, unreadMessages] = await Promise.all([
    auth(),
    prisma.booking.count({ where: BOOKING_SCOPES.new }),
    getSiteSettings(),
    prisma.contactMessage.count({ where: { isRead: false, archivedAt: null } }),
  ]);

  if (!session?.user) {
    redirect('/admin-login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/admin-login');
  }


  // The print: classes strip the panel away so a receipt prints on its own.
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 print:block print:h-auto print:overflow-visible print:bg-white">
      {/* Sidebar */}
      <aside className="theme-fixed w-64 bg-ocean-900 text-slate-300 flex flex-col print:hidden">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <span className="text-xl font-bold text-white tracking-wider">N34 <span className="font-light text-ocean-400">Admin</span></span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <Link href="/admin" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Dashboard
          </Link>
          {/* Bookings: two screens, with a count where work is waiting */}
          <div>
            <p className="px-3 py-2.5 text-sm font-medium">Bookings</p>
            <div className="ml-3 space-y-1 border-l border-white/10 pl-2">
              {[
                { href: '/admin/bookings/walk-in', label: 'Walk-in booking', count: 0 },
                { href: '/admin/bookings', label: 'New bookings', count: newBookings },
                { href: '/admin/bookings/records', label: 'Booking records', count: 0 },
                { href: '/admin/availability', label: 'Room availability', count: 0 },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors"
                >
                  {item.label}
                  {item.count > 0 && (
                    <span className="rounded-full bg-sand-500 px-2 py-0.5 text-[11px] font-bold text-white">{item.count}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/admin/rooms" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Rooms Management
          </Link>
          <Link href="/admin/dining" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Dining
          </Link>
          <Link href="/admin/amenities" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Features & Facilities
          </Link>
          <Link href="/admin/messages" className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Messages
            {unreadMessages > 0 && <span className="rounded-full bg-sand-500 px-2 py-0.5 text-[11px] font-bold text-white">{unreadMessages}</span>}
          </Link>
          <Link href="/admin/experiences" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Experiences
          </Link>
          <Link href="/admin/settings" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Site Settings
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <form action={async () => {
            'use server';
            await signOut({ redirectTo: '/admin-login' });
          }}>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-lg transition-colors">
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden print:block print:overflow-visible">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm print:hidden">
          <h1 className="text-xl font-semibold text-slate-800">Overview</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle className="text-slate-600 hover:bg-slate-100" />
            <AdminClock />
          </div>
        </header>
        {/* relative: keeps absolutely positioned children (e.g. sr-only labels) inside this scroll area, so they cannot stretch the page */}
        <main className="relative flex-1 overflow-y-auto p-8 bg-slate-50 print:overflow-visible print:bg-white print:p-0">
          {/* A reminder while the public site or online booking is switched off. */}
          {(site.maintenance || site.bookingsPaused) && (
            <div role="status" className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 px-5 py-3 text-sm text-amber-700 ring-1 ring-inset ring-amber-200 print:hidden">
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
              <span className="font-medium">
                {site.maintenance && 'Maintenance mode is on: visitors see the maintenance page. '}
                {site.bookingsPaused && 'Online booking is paused.'}
              </span>
              <Link href="/admin/settings" className="ml-auto font-semibold underline underline-offset-2">Site Settings</Link>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-ocean-900 text-slate-300 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <span className="text-xl font-bold text-white tracking-wider">N34 <span className="font-light text-ocean-400">Admin</span></span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <Link href="/admin" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/bookings" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Bookings
          </Link>
          <Link href="/admin/rooms" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Rooms Management
          </Link>
          <Link href="/admin/users" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Users & Guests
          </Link>
          <Link href="/admin/experiences" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Experiences
          </Link>
          <Link href="/admin/settings" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors">
            Site Settings
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <button className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-lg transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-800">Overview</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Admin User</span>
            <div className="w-10 h-10 bg-ocean-100 rounded-full flex items-center justify-center text-ocean-700 font-bold">
              A
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}

import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [totalBookings, totalRooms, totalUsers, totalMessages] = await Promise.all([
    prisma.booking.count(),
    prisma.room.count(),
    prisma.user.count(),
    prisma.contactMessage.count(),
  ]);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Bookings</h3>
          <p className="text-3xl font-bold text-slate-800">{totalBookings}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Rooms</h3>
          <p className="text-3xl font-bold text-slate-800">{totalRooms}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Registered Users</h3>
          <p className="text-3xl font-bold text-slate-800">{totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">New Inquiries</h3>
          <p className="text-3xl font-bold text-slate-800">{totalMessages}</p>
        </div>
      </div>

      {/* Recent Bookings Table placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-sm text-ocean-600 font-medium hover:text-ocean-700">View All</Link>
        </div>
        <div className="p-6">
          <div className="text-center py-10 text-slate-500 text-sm">
            {totalBookings === 0 ? "No bookings have been made yet." : "Recent bookings will appear here."}
          </div>
        </div>
      </div>
    </div>
  );
}

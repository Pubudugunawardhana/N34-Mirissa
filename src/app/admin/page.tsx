export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Bookings</h3>
          <p className="text-3xl font-bold text-slate-800">124</p>
          <span className="text-xs text-emerald-500 font-medium">+12% from last month</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Available Rooms</h3>
          <p className="text-3xl font-bold text-slate-800">8</p>
          <span className="text-xs text-slate-400 font-medium">Out of 15 total</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Revenue (This Month)</h3>
          <p className="text-3xl font-bold text-slate-800">$4,250</p>
          <span className="text-xs text-emerald-500 font-medium">+5% from last month</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">New Inquiries</h3>
          <p className="text-3xl font-bold text-slate-800">12</p>
          <span className="text-xs text-sand-500 font-medium">Requires attention</span>
        </div>
      </div>

      {/* Recent Bookings Table placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Recent Bookings</h2>
          <button className="text-sm text-ocean-600 font-medium hover:text-ocean-700">View All</button>
        </div>
        <div className="p-6">
          <div className="text-center py-10 text-slate-500 text-sm">
            Booking data will be loaded here from the database.
          </div>
        </div>
      </div>
    </div>
  );
}

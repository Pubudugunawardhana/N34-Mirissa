import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminRoomsPage() {
  // Check if we have rooms, if not, let's create a couple of sample rooms for the demo
  let rooms = await prisma.room.findMany({
    orderBy: { createdAt: 'desc' }
  });

  if (rooms.length === 0) {
    await prisma.room.createMany({
      data: [
        {
          name: 'Ocean View Suite',
          area: 450,
          capacity: 2,
          price: 150.00,
          quantity: 5,
          description: 'A beautiful suite with a direct view of the Mirissa ocean. Includes a private balcony.',
        },
        {
          name: 'Family Beach Villa',
          area: 850,
          capacity: 4,
          price: 280.00,
          quantity: 2,
          description: 'Spacious villa perfect for families, located steps away from the beach.',
        },
        {
          name: 'Standard Double Room',
          area: 300,
          capacity: 2,
          price: 85.00,
          quantity: 8,
          description: 'Comfortable standard room with all essential luxury amenities.',
        }
      ]
    });
    // Re-fetch after seeding
    rooms = await prisma.room.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rooms Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all available rooms, pricing, and inventory.</p>
        </div>
        <Link href="/admin/rooms/new" className="bg-ocean-600 hover:bg-ocean-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-ocean-600/20">
          + Add New Room
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Room Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Base Price</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capacity</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Area (Sq.Ft)</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Qty</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-medium text-slate-800">{room.name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[250px]">{room.description}</p>
                  </td>
                  <td className="py-4 px-6 font-medium text-ocean-700">
                    ${room.price.toFixed(2)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-slate-600 text-sm">
                      <span className="w-4 h-4">👥</span> {room.capacity} Persons
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600">
                    {room.area}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {room.quantity} Available
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-3 text-sm">
                    <button className="font-medium text-ocean-600 hover:text-ocean-800 transition-colors">Edit</button>
                    <button className="font-medium text-red-500 hover:text-red-700 transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="text-sm text-slate-500">Showing <span className="font-medium">1</span> to <span className="font-medium">{rooms.length}</span> of <span className="font-medium">{rooms.length}</span> rooms</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-300 rounded-md bg-white text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50">Previous</button>
            <button className="px-3 py-1 border border-slate-300 rounded-md bg-white text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

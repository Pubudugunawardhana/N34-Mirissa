import { createRoom } from '@/app/actions/rooms';
import Link from 'next/link';

export default function AddRoomPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/rooms" className="text-slate-500 hover:text-ocean-600 transition-colors">
          ← Back to Rooms
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Add New Room</h1>
      </div>

      <form action={createRoom} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Room Name</label>
            <input type="text" name="name" required className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500" placeholder="e.g. Ocean View Suite" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price per Night ($)</label>
            <input type="number" step="0.01" name="price" required className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500" placeholder="150.00" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capacity (Persons)</label>
            <input type="number" name="capacity" required className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500" placeholder="2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Area (Sq.Ft)</label>
            <input type="number" name="area" required className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500" placeholder="450" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Total Quantity</label>
            <input type="number" name="quantity" required className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500" placeholder="5" />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea name="description" rows={4} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500" placeholder="Describe the room features and view..."></textarea>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Link href="/admin/rooms" className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button type="submit" className="bg-ocean-600 hover:bg-ocean-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-ocean-600/20">
            Save Room
          </button>
        </div>
      </form>
    </div>
  );
}

import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { deleteRoom, toggleRoomActive } from '@/app/actions/rooms';
import Alert from '@/components/auth/Alert';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import { formatLKR, guestSummary } from '@/lib/booking';

export const dynamic = 'force-dynamic';

const NOTICES: Record<string, { variant: 'success' | 'error'; text: string }> = {
  saved: { variant: 'success', text: 'Room saved.' },
  deleted: { variant: 'success', text: 'Room deleted.' },
  'has-bookings': {
    variant: 'error',
    text: 'This room has bookings, so it cannot be deleted. Mark it as hidden instead to stop new bookings.',
  },
};

export default async function AdminRoomsPage({ searchParams }: PageProps<'/admin/rooms'>) {
  const params = await searchParams;
  const notice = typeof params.notice === 'string' ? NOTICES[params.notice] : undefined;

  const rooms = await prisma.room.findMany({
    include: { images: { orderBy: { position: 'asc' }, take: 1 }, _count: { select: { bookings: true } } },
    orderBy: { createdAt: 'desc' },
  });

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

      {notice && <Alert variant={notice.variant}>{notice.text}</Alert>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {rooms.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-medium text-slate-700">No rooms yet</p>
            <p className="mt-1 text-sm text-slate-500">Add your first room to start taking bookings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Room</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price / night</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Guests</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Area</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Availability</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {room.images[0] ? (
                            <Image src={room.images[0].url} alt="" fill sizes="80px" className="object-cover" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">No photo</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">{room.name}</p>
                          <p className="text-xs text-slate-500">
                            {room._count.bookings} {room._count.bookings === 1 ? 'booking' : 'bookings'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-ocean-700 whitespace-nowrap">{formatLKR(room.price)}</td>
                    <td className="py-4 px-6 text-sm text-slate-600 whitespace-nowrap">{guestSummary(room.maxAdults, room.maxChildren)}</td>
                    <td className="py-4 px-6 text-sm text-slate-600 whitespace-nowrap">{room.area} sq ft</td>
                    <td className="py-4 px-6 text-sm text-slate-600">{room.quantity}</td>
                    <td className="py-4 px-6">
                      <form action={toggleRoomActive.bind(null, room.id, !room.isActive)}>
                        <button
                          title={room.isActive ? 'Click to hide from guests' : 'Click to make available'}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
                            room.isActive
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                          {room.isActive ? 'Available' : 'Hidden'}
                        </button>
                      </form>
                    </td>
                    <td className="py-4 px-6 text-right text-sm whitespace-nowrap">
                      <div className="flex items-center justify-end gap-4">
                        <Link href={`/admin/rooms/${room.id}/edit`} className="font-medium text-ocean-600 hover:text-ocean-800 transition-colors">
                          Edit
                        </Link>
                        <form action={deleteRoom.bind(null, room.id)}>
                          <ConfirmSubmitButton
                            title="Delete this room?"
                            confirmLabel="Delete room"
                            cancelLabel="Keep room"
                            confirmMessage={`Delete "${room.name}" and its photos? This cannot be undone.`}
                            className="font-medium text-red-500 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

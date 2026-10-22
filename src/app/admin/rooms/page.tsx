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

const headClass = 'px-6 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-500';
// Each cell carries the card's top and bottom border; the first and last add the sides and round corners.
const cellClass = 'border-y border-slate-200 bg-white px-6 py-4 shadow-sm transition-colors group-hover:border-ocean-400';

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
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/rooms" target="_blank" className="text-sm font-medium text-ocean-600 hover:text-ocean-800">
            View Rooms page ↗
          </Link>
          <Link href="/admin/rooms/new" className="bg-ocean-600 hover:bg-ocean-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-ocean-600/20">
            + Add New Room
          </Link>
        </div>
      </div>

      {notice && <Alert variant={notice.variant}>{notice.text}</Alert>}

      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="font-medium text-slate-700">No rooms yet</p>
          <p className="mt-1 text-sm text-slate-500">Add your first room to start taking bookings.</p>
        </div>
      ) : (
        // Still a table, but each row stands apart as its own card.
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3 text-left">
            <thead>
              <tr>
                <th className={headClass}>Room</th>
                <th className={headClass}>Price / night</th>
                <th className={headClass}>Guests</th>
                <th className={headClass}>Area</th>
                <th className={headClass}>Qty</th>
                <th className={headClass}>Availability</th>
                <th className={`${headClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} data-room-card={room.name} className="group">
                  <td className={`${cellClass} rounded-l-2xl border-l`}>
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
                  <td className={`${cellClass} whitespace-nowrap font-medium text-ocean-700`}>{formatLKR(room.price)}</td>
                  <td className={`${cellClass} whitespace-nowrap text-sm text-slate-600`}>{guestSummary(room.maxAdults, room.maxChildren)}</td>
                  <td className={`${cellClass} whitespace-nowrap text-sm text-slate-600`}>{room.area} sq ft</td>
                  <td className={`${cellClass} text-sm text-slate-600`}>
                    {room.quantity}
                    {room.roomNumbers.length > 0 && <p className="mt-0.5 max-w-40 text-xs leading-snug text-slate-400">{room.roomNumbers.join(', ')}</p>}
                  </td>
                  <td className={cellClass}>
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
                  <td className={`${cellClass} rounded-r-2xl border-r whitespace-nowrap text-right text-sm`}>
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/admin/rooms/${room.id}/edit`} className="font-medium text-ocean-600 transition-colors hover:text-ocean-800">
                        Edit
                      </Link>
                      <form action={deleteRoom.bind(null, room.id)}>
                        <ConfirmSubmitButton
                          title="Delete this room?"
                          confirmLabel="Delete room"
                          cancelLabel="Keep room"
                          confirmMessage={`Delete "${room.name}" and its photos? This cannot be undone.`}
                          className="font-medium text-red-500 transition-colors hover:text-red-700"
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
  );
}

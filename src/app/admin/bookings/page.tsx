import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminBookings() {
  const bookings = await prisma.booking.findMany({
    include: { room: true, user: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold text-slate-800'>Bookings Management</h1>
      <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
        <table className='w-full text-left'>
          <thead className='bg-slate-50 border-b border-slate-200'>
            <tr>
              <th className='p-4 text-sm font-semibold text-slate-600'>Guest</th>
              <th className='p-4 text-sm font-semibold text-slate-600'>Room</th>
              <th className='p-4 text-sm font-semibold text-slate-600'>Dates</th>
              <th className='p-4 text-sm font-semibold text-slate-600'>Status</th>
              <th className='p-4 text-sm font-semibold text-slate-600'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {bookings.map(b => (
              <tr key={b.id}>
                <td className='p-4'>
                  <p className='font-medium'>{b.user.name}</p>
                  <p className='text-xs text-slate-500'>{b.user.email}</p>
                </td>
                <td className='p-4 font-medium'>{b.room.name}</td>
                <td className='p-4 text-sm'>
                  {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                </td>
                <td className='p-4'>
                  <span className='px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium'>{b.status}</span>
                </td>
                <td className='p-4 space-x-2 text-sm'>
                  <button className='text-emerald-600 font-medium'>Confirm</button>
                  <button className='text-red-600 font-medium'>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

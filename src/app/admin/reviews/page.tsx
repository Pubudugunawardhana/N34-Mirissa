import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export default async function AdminReviews() {
  const reviews = await prisma.review.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold text-slate-800'>Customer Reviews</h1>
      <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6'>
        {reviews.length === 0 ? <p className='text-slate-500'>No reviews submitted yet.</p> : null}
        <div className='divide-y divide-slate-100'>
          {reviews.map(r => (
            <div key={r.id} className='py-4'>
              <h3 className='font-bold'>{r.user.name} - Room ID: {r.roomId}</h3>
              <p className='text-yellow-500'>{'?'.repeat(r.rating)}{'?'.repeat(5-r.rating)}</p>
              <p className='text-slate-600 mt-2'>{r.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

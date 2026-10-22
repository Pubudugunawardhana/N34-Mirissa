import prisma from '@/lib/prisma';
import { createWedding } from '@/app/actions/cms';
export const dynamic = 'force-dynamic';
export default async function AdminWeddings() {
  const weddings = await prisma.weddingPackage.findMany();
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold text-slate-800'>Manage Weddings</h1>
      <form action={createWedding} className='bg-white p-6 rounded-xl border border-slate-200 space-y-4'>
        <input type='text' name='name' placeholder='Package Name' required className='w-full border p-2 rounded' />
        <textarea name='description' placeholder='Description' required className='w-full border p-2 rounded'></textarea>
        <input type='text' name='venueDetails' placeholder='Venue Details' required className='w-full border p-2 rounded' />
        <input type='text' name='diningOptions' placeholder='Dining Options' required className='w-full border p-2 rounded' />
        <input type='text' name='features' placeholder='Special Features' required className='w-full border p-2 rounded' />
        <button type='submit' className='bg-ocean-600 text-white px-4 py-2 rounded'>Add Package</button>
      </form>
      <div className='grid gap-4'>
        {weddings.map(w => <div key={w.id} className='bg-white p-4 border rounded'>{w.name}</div>)}
      </div>
    </div>
  );
}


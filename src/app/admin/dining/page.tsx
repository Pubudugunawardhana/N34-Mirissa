import prisma from '@/lib/prisma';
import { createDining } from '@/app/actions/cms';
export const dynamic = 'force-dynamic';
export default async function AdminDining() {
  const dining = await prisma.dining.findMany();
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold text-slate-800'>Manage Dining</h1>
      <form action={createDining} className='bg-white p-6 rounded-xl border border-slate-200 space-y-4'>
        <input type='text' name='name' placeholder='Restaurant Name' required className='w-full border p-2 rounded' />
        <input type='text' name='type' placeholder='Type (e.g. Seafood, Bar)' required className='w-full border p-2 rounded' />
        <textarea name='description' placeholder='Description' required className='w-full border p-2 rounded'></textarea>
        <div className='flex gap-4'>
          <input type='text' name='openingHours' placeholder='Opening Hours' required className='w-full border p-2 rounded' />
          <input type='text' name='location' placeholder='Location' required className='w-full border p-2 rounded' />
        </div>
        <button type='submit' className='bg-ocean-600 text-white px-4 py-2 rounded'>Add Dining</button>
      </form>
      <div className='grid gap-4'>
        {dining.map(d => <div key={d.id} className='bg-white p-4 border rounded'>{d.name}</div>)}
      </div>
    </div>
  );
}

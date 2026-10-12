import prisma from '@/lib/prisma';
import { createExperience } from '@/app/actions/cms';
export const dynamic = 'force-dynamic';
export default async function AdminExperiences() {
  const experiences = await prisma.experience.findMany();
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold text-slate-800'>Manage Experiences</h1>
      <form action={createExperience} className='bg-white p-6 rounded-xl border border-slate-200 space-y-4'>
        <input type='text' name='title' placeholder='Title' required className='w-full border p-2 rounded' />
        <textarea name='description' placeholder='Description' required className='w-full border p-2 rounded'></textarea>
        <div className='flex gap-4'>
          <input type='number' step='0.01' name='price' placeholder='Price' required className='w-full border p-2 rounded' />
          <input type='text' name='duration' placeholder='duration (e.g. 2 Hours)' required className='w-full border p-2 rounded' />
        </div>
        <input type='text' name='phone' placeholder='Contact Info' required className='w-full border p-2 rounded' />
        <button type='submit' className='bg-ocean-600 text-white px-4 py-2 rounded'>Add Experience</button>
      </form>
      <div className='grid gap-4'>
        {experiences.map(e => <div key={e.id} className='bg-white p-4 border rounded'>{e.title} - </div>)}
      </div>
    </div>
  );
}


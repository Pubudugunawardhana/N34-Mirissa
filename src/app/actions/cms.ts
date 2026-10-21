'use server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createWedding(formData: FormData) {
  await prisma.weddingPackage.create({
    data: {
      name: formData.get('packageName') as string,
      description: formData.get('description') as string,
      venueDetails: formData.get('venueDetails') as string,
      diningOptions: formData.get('diningOptions') as string,
      features: formData.get('specialFeatures') as string,
    }
  });
  revalidatePath('/admin/weddings');
  revalidatePath('/weddings');
  redirect('/admin/weddings');
}


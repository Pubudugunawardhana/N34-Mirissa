'use server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createExperience(formData: FormData) {
  await prisma.experience.create({
    data: {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      duration: formData.get('time') as string,
      phone: formData.get('contactInfo') as string,
    }
  });
  revalidatePath('/admin/experiences');
  revalidatePath('/experiences');
  redirect('/admin/experiences');
}

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


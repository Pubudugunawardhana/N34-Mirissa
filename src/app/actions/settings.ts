'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateSettings(formData: FormData) {
  const siteTitle = formData.get('siteTitle') as string;
  const aboutUs = formData.get('aboutUs') as string;
  const contactPhone = formData.get('contactPhone') as string;
  const contactEmail = formData.get('contactEmail') as string;

  try {
    // Assuming there's only one setting row, ID = 1
    await prisma.setting.upsert({
      where: { id: 'default' },
      update: {
        siteTitle,
        aboutUs,
        contactPhone,
        contactEmail,
      },
      create: {
        id: 'default',
        siteTitle,
        aboutUs,
        contactPhone,
        contactEmail,
      },
    });
  } catch (error) {
    return { message: 'Database Error: Failed to Update Settings.' };
  }

  revalidatePath('/admin/settings');
}

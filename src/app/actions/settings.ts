'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateSettings(formData: FormData) {
  const siteTitle = formData.get('siteTitle') as string;
  const aboutUs = formData.get('aboutUs') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;

  try {
    // Assuming there's only one setting row, ID = 1
    await prisma.setting.upsert({
      where: { id: 'default' },
      update: {
        siteTitle,
        aboutUs,
        phone,
        email,
      },
      create: {
        id: 'default',
        siteTitle,
        aboutUs,
        phone,
        email,
      },
    });
  } catch (error) {
    throw new Error('Failed to update settings');
  }

  revalidatePath('/admin/settings');
}



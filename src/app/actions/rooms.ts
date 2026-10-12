'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createRoom(formData: FormData) {
  const name = formData.get('name') as string;
  const area = parseInt(formData.get('area') as string);
  const capacity = parseInt(formData.get('capacity') as string);
  const price = parseFloat(formData.get('price') as string);
  const quantity = parseInt(formData.get('quantity') as string);
  const description = formData.get('description') as string;

  try {
    await prisma.room.create({
      data: {
        name,
        area,
        capacity,
        price,
        quantity,
        description,
      },
    });
  } catch (error) {
    throw new Error('Failed to create room');
  }

  revalidatePath('/admin/rooms');
  redirect('/admin/rooms');
}

export async function deleteRoom(id: string) {
  try {
    await prisma.room.delete({
      where: { id },
    });
    revalidatePath('/admin/rooms');
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Room.' };
  }
}


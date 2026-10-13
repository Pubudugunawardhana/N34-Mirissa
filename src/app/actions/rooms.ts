'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/session';
import { removeRoomImageFile, uploadRoomImage, validateImageFile } from '@/lib/uploads';
import { RoomSchema, type FieldErrors } from '@/lib/validation';

const MAX_IMAGES_PER_ROOM = 8;

export type RoomFormState = {
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
};

function revalidateRooms() {
  revalidatePath('/admin/rooms');
  revalidatePath('/rooms');
}

function strings(formData: FormData, name: string) {
  return formData.getAll(name).filter((value): value is string => typeof value === 'string' && value !== '');
}

// Creates a room, or updates the one named by the hidden "id" field.
export async function saveRoom(prevState: RoomFormState, formData: FormData): Promise<RoomFormState> {
  await requireAdmin();

  const fieldNames = ['name', 'description', 'price', 'area', 'quantity', 'maxAdults', 'maxChildren'];
  const values = Object.fromEntries(fieldNames.map((field) => [field, String(formData.get(field) ?? '')]));

  const validatedFields = RoomSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Please fix the highlighted fields. Photos need to be chosen again.',
      values,
    };
  }

  const id = String(formData.get('id') ?? '');
  const files = formData.getAll('images').filter((value): value is File => value instanceof File && value.size > 0);
  const removeImageIds = strings(formData, 'removeImageIds');

  for (const file of files) {
    const problem = validateImageFile(file);
    if (problem) return { errors: { images: [problem] }, message: problem, values };
  }

  const existingImages = id ? await prisma.roomImage.findMany({ where: { roomId: id } }) : [];
  const imagesToRemove = existingImages.filter((image) => removeImageIds.includes(image.id));
  const keptCount = existingImages.length - imagesToRemove.length;

  if (keptCount + files.length > MAX_IMAGES_PER_ROOM) {
    const problem = `A room can have at most ${MAX_IMAGES_PER_ROOM} photos.`;
    return { errors: { images: [problem] }, message: problem, values };
  }

  const { maxAdults, maxChildren, ...rest } = validatedFields.data;
  const data = {
    ...rest,
    maxAdults,
    maxChildren,
    capacity: maxAdults + maxChildren,
    isActive: formData.get('isActive') === 'on',
  };

  try {
    const [featureIds, facilityIds] = await Promise.all([
      prisma.feature.findMany({ where: { id: { in: strings(formData, 'featureIds') } }, select: { id: true } }),
      prisma.facility.findMany({ where: { id: { in: strings(formData, 'facilityIds') } }, select: { id: true } }),
    ]);

    const room = id
      ? await prisma.room.update({ where: { id }, data })
      : await prisma.room.create({ data });

    await prisma.$transaction([
      prisma.roomFeature.deleteMany({ where: { roomId: room.id } }),
      prisma.roomFeature.createMany({ data: featureIds.map((feature) => ({ roomId: room.id, featureId: feature.id })) }),
      prisma.roomFacility.deleteMany({ where: { roomId: room.id } }),
      prisma.roomFacility.createMany({ data: facilityIds.map((facility) => ({ roomId: room.id, facilityId: facility.id })) }),
      prisma.roomImage.deleteMany({ where: { id: { in: imagesToRemove.map((image) => image.id) } } }),
    ]);
    await Promise.all(imagesToRemove.map(removeRoomImageFile));

    let position = Math.max(-1, ...existingImages.map((image) => image.position)) + 1;
    for (const file of files) {
      const uploaded = await uploadRoomImage(file);
      await prisma.roomImage.create({ data: { roomId: room.id, position: position++, ...uploaded } });
    }
  } catch (error) {
    console.error('Failed to save room', error);
    return { message: 'Something went wrong while saving the room. Please try again.', values };
  }

  revalidateRooms();
  redirect('/admin/rooms?notice=saved');
}

export async function toggleRoomActive(id: string, isActive: boolean) {
  await requireAdmin();

  await prisma.room.update({ where: { id }, data: { isActive } });
  revalidateRooms();
}

export async function deleteRoom(id: string) {
  await requireAdmin();

  // Bookings keep pointing at their room, so a room with history can only be hidden.
  const bookings = await prisma.booking.count({ where: { roomId: id } });
  if (bookings > 0) redirect('/admin/rooms?notice=has-bookings');

  const images = await prisma.roomImage.findMany({ where: { roomId: id } });
  await prisma.room.delete({ where: { id } });
  await Promise.all(images.map(removeRoomImageFile));

  revalidateRooms();
  redirect('/admin/rooms?notice=deleted');
}

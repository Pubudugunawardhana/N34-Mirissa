'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/session';
import { todayDateOnly, parseDateOnly } from '@/lib/booking';
import { MAX_ROOM_NUMBER_LENGTH, MAX_ROOM_NUMBERS, parseRoomNumbers } from '@/lib/room-occupancy';
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

// Checks the room numbers typed for a room type. Returns the problem to show, or nothing when they are fine.
async function checkRoomNumbers(roomNumbers: string[], roomId: string) {
  if (roomNumbers.length > MAX_ROOM_NUMBERS) return `A room type can have at most ${MAX_ROOM_NUMBERS} room numbers.`;
  const tooLong = roomNumbers.find((value) => value.length > MAX_ROOM_NUMBER_LENGTH);
  if (tooLong) return `"${tooLong.slice(0, 30)}…" is too long for a room number.`;

  const seen = new Set<string>();
  for (const value of roomNumbers) {
    const key = value.toLowerCase();
    if (seen.has(key)) return `Room ${value} is listed twice.`;
    seen.add(key);
  }

  // A room number belongs to one room type only, so the hotel never has two "101"s.
  const otherRooms = await prisma.room.findMany({
    where: roomId ? { id: { not: roomId } } : {},
    select: { name: true, roomNumbers: true },
  });
  for (const other of otherRooms) {
    const clash = other.roomNumbers.find((value) => seen.has(value.toLowerCase()));
    if (clash) return `Room ${clash} already belongs to ${other.name}.`;
  }

  // A number can only be taken away once no current or upcoming booking holds it.
  if (roomId) {
    const today = parseDateOnly(todayDateOnly())!;
    const held = await prisma.booking.findFirst({
      where: {
        roomId,
        roomNumber: { not: null, notIn: roomNumbers },
        bookingStatus: { not: 'CANCELLED' },
        checkOut: { gt: today },
      },
      select: { roomNumber: true, reference: true },
    });
    if (held) return `Room ${held.roomNumber} is assigned to booking ${held.reference}. Give that booking another room before removing the number.`;
  }
}

function strings(formData: FormData, name: string) {
  return formData.getAll(name).filter((value): value is string => typeof value === 'string' && value !== '');
}

// Creates a room, or updates the one named by the hidden "id" field.
export async function saveRoom(prevState: RoomFormState, formData: FormData): Promise<RoomFormState> {
  await requireAdmin();

  const fieldNames = ['name', 'description', 'price', 'area', 'quantity', 'roomNumbers', 'maxAdults', 'maxChildren'];
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

  const roomNumbers = parseRoomNumbers(values.roomNumbers);
  const roomNumberProblem = await checkRoomNumbers(roomNumbers, id);
  if (roomNumberProblem) return { errors: { roomNumbers: [roomNumberProblem] }, message: roomNumberProblem, values };

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

  const { maxAdults, maxChildren, quantity, ...rest } = validatedFields.data;
  const data = {
    ...rest,
    roomNumbers,
    // With room numbers, the number of rooms is simply how many there are.
    quantity: roomNumbers.length > 0 ? roomNumbers.length : quantity,
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

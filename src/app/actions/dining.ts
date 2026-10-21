'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { SETTINGS_ID } from '@/lib/hotel';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { removeDiningImageFile, uploadDiningImage, validateImageFile } from '@/lib/uploads';

export type DiningFormState = { error?: string; errors?: Record<string, string[] | undefined>; saved?: number };

function revalidateDining() {
  revalidatePath('/dining');
  revalidatePath('/admin/dining');
}

const text = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label} is too short.`).max(max, `${label} is too long.`);

const ServiceSchema = z.object({
  title: text(2, 40, 'The title'),
  tagline: z.string().trim().max(80, 'The tagline is too long.'),
  hours: text(3, 40, 'The hours'),
  description: text(10, 600, 'The description'),
});

// The meal's details and photo. A new photo replaces the old one, which is deleted if it was uploaded here.
export async function saveMealService(serviceId: string, prevState: DiningFormState, formData: FormData): Promise<DiningFormState> {
  await requireAdmin();

  const parsed = ServiceSchema.safeParse({
    title: formData.get('title') ?? '',
    tagline: formData.get('tagline') ?? '',
    hours: formData.get('hours') ?? '',
    description: formData.get('description') ?? '',
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, error: 'Please fix the highlighted fields.' };

  const service = await prisma.mealService.findUnique({ where: { id: serviceId } });
  if (!service) return { error: 'This meal no longer exists.' };

  const photo = formData.get('photo');
  let image: { imageUrl: string; imagePublicId: string | null } | undefined;
  if (photo instanceof File && photo.size > 0) {
    const problem = validateImageFile(photo);
    if (problem) return { errors: { photo: [problem] }, error: problem };
    const uploaded = await uploadDiningImage(photo);
    image = { imageUrl: uploaded.url, imagePublicId: uploaded.publicId };
  }

  await prisma.mealService.update({
    where: { id: serviceId },
    data: { ...parsed.data, tagline: parsed.data.tagline || null, isAvailable: formData.get('isAvailable') === 'on', ...image },
  });
  if (image && service.imageUrl) await removeDiningImageFile({ url: service.imageUrl, publicId: service.imagePublicId });

  revalidateDining();
  return { saved: Date.now() };
}

const ItemSchema = z.object({
  name: text(2, 80, 'The dish name'),
  description: z.string().trim().max(200, 'The description is too long.'),
  // Empty means included, or no separate price.
  price: z.union([
    z.literal(''),
    z.coerce.number('Enter a price in LKR.').positive('The price must be more than 0.').max(1_000_000, 'The price is too high.'),
  ]),
});

function readItem(formData: FormData) {
  const parsed = ItemSchema.safeParse({
    name: formData.get('name') ?? '',
    description: formData.get('description') ?? '',
    price: String(formData.get('price') ?? '').trim(),
  });
  if (!parsed.success) return { problem: { errors: z.flattenError(parsed.error).fieldErrors, error: 'Please fix the highlighted fields.' } };
  return {
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price === '' ? null : parsed.data.price,
      isVegetarian: formData.get('isVegetarian') === 'on',
      isSpicy: formData.get('isSpicy') === 'on',
    },
  };
}

export async function addMenuItem(serviceId: string, prevState: DiningFormState, formData: FormData): Promise<DiningFormState> {
  await requireAdmin();
  const item = readItem(formData);
  if (item.problem) return item.problem;

  const last = await prisma.menuItem.findFirst({ where: { serviceId }, orderBy: { position: 'desc' }, select: { position: true } });
  await prisma.menuItem.create({ data: { serviceId, ...item.data, position: (last?.position ?? -1) + 1 } });
  revalidateDining();
  return { saved: Date.now() };
}

export async function updateMenuItem(itemId: string, prevState: DiningFormState, formData: FormData): Promise<DiningFormState> {
  await requireAdmin();
  const item = readItem(formData);
  if (item.problem) return item.problem;

  await prisma.menuItem.updateMany({ where: { id: itemId }, data: item.data });
  revalidateDining();
  return { saved: Date.now() };
}

// Swaps the dish with its neighbour above or below.
export async function moveMenuItem(itemId: string, direction: 'up' | 'down') {
  await requireAdmin();
  const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!item) return;

  const neighbour = await prisma.menuItem.findFirst({
    where: { serviceId: item.serviceId, position: direction === 'up' ? { lt: item.position } : { gt: item.position } },
    orderBy: { position: direction === 'up' ? 'desc' : 'asc' },
  });
  if (!neighbour) return;

  await prisma.$transaction([
    prisma.menuItem.update({ where: { id: item.id }, data: { position: neighbour.position } }),
    prisma.menuItem.update({ where: { id: neighbour.id }, data: { position: item.position } }),
  ]);
  revalidateDining();
}

export async function deleteMenuItem(itemId: string) {
  await requireAdmin();
  await prisma.menuItem.deleteMany({ where: { id: itemId } });
  revalidateDining();
}

// Swaps a row's position with its neighbour above or below, in whichever ordered table it lives.
async function swapPositions(
  model: 'diningExperience' | 'diningPhoto',
  id: string,
  direction: 'up' | 'down',
) {
  const table = prisma[model] as unknown as {
    findUnique: (args: object) => Promise<{ id: string; position: number } | null>;
    findFirst: (args: object) => Promise<{ id: string; position: number } | null>;
    update: (args: object) => Promise<unknown>;
  };
  const item = await table.findUnique({ where: { id } });
  if (!item) return;
  const neighbour = await table.findFirst({
    where: { position: direction === 'up' ? { lt: item.position } : { gt: item.position } },
    orderBy: { position: direction === 'up' ? 'desc' : 'asc' },
  });
  if (!neighbour) return;
  await table.update({ where: { id: item.id }, data: { position: neighbour.position } });
  await table.update({ where: { id: neighbour.id }, data: { position: item.position } });
}

/* ---------------------------------------------------------------------------
   Special dinners
   --------------------------------------------------------------------------- */

const ExperienceSchema = z.object({
  title: text(3, 60, 'The title'),
  description: text(10, 500, 'The description'),
  price: z.coerce.number('Enter a price in LKR.').positive('The price must be more than 0.').max(10_000_000, 'The price is too high.'),
  priceUnit: z.enum(['PER_PERSON', 'PER_COUPLE', 'PER_GROUP'], 'Choose how the price is counted.'),
  duration: z.string().trim().max(40, 'Keep the duration short.'),
});

function readExperience(formData: FormData) {
  const parsed = ExperienceSchema.safeParse({
    title: formData.get('title') ?? '',
    description: formData.get('description') ?? '',
    price: formData.get('price') ?? '',
    priceUnit: formData.get('priceUnit') ?? '',
    duration: formData.get('duration') ?? '',
  });
  if (!parsed.success) {
    const problem: DiningFormState = { errors: z.flattenError(parsed.error).fieldErrors, error: 'Please fix the highlighted fields.' };
    return { problem };
  }
  return { data: { ...parsed.data, duration: parsed.data.duration || null } };
}

// Uploads the chosen photo, if any. Returns a problem to show, or the stored image.
async function readPhoto(formData: FormData) {
  const photo = formData.get('photo');
  if (!(photo instanceof File) || photo.size === 0) return {};
  const message = validateImageFile(photo);
  if (message) {
    const problem: DiningFormState = { errors: { photo: [message] }, error: message };
    return { problem };
  }
  const uploaded = await uploadDiningImage(photo);
  return { image: { imageUrl: uploaded.url, imagePublicId: uploaded.publicId } };
}

export async function addExperience(prevState: DiningFormState, formData: FormData): Promise<DiningFormState> {
  await requireAdmin();
  const experience = readExperience(formData);
  if (experience.problem) return experience.problem;
  const photo = await readPhoto(formData);
  if (photo.problem) return photo.problem;

  const last = await prisma.diningExperience.findFirst({ orderBy: { position: 'desc' }, select: { position: true } });
  await prisma.diningExperience.create({ data: { ...experience.data, ...photo.image, position: (last?.position ?? -1) + 1 } });
  revalidateDining();
  return { saved: Date.now() };
}

export async function updateExperience(id: string, prevState: DiningFormState, formData: FormData): Promise<DiningFormState> {
  await requireAdmin();
  const current = await prisma.diningExperience.findUnique({ where: { id } });
  if (!current) return { error: 'This experience no longer exists.' };
  const experience = readExperience(formData);
  if (experience.problem) return experience.problem;
  const photo = await readPhoto(formData);
  if (photo.problem) return photo.problem;

  await prisma.diningExperience.update({
    where: { id },
    data: { ...experience.data, ...photo.image, isActive: formData.get('isActive') === 'on' },
  });
  // The old photo goes once the new one is saved (placeholders from /images are never deleted).
  if (photo.image && current.imageUrl) await removeDiningImageFile({ url: current.imageUrl, publicId: current.imagePublicId });
  revalidateDining();
  return { saved: Date.now() };
}

export async function moveExperience(id: string, direction: 'up' | 'down') {
  await requireAdmin();
  await swapPositions('diningExperience', id, direction);
  revalidateDining();
}

export async function deleteExperience(id: string) {
  await requireAdmin();
  const item = await prisma.diningExperience.findUnique({ where: { id } });
  if (!item) return;
  await prisma.diningExperience.delete({ where: { id } });
  if (item.imageUrl) await removeDiningImageFile({ url: item.imageUrl, publicId: item.imagePublicId });
  revalidateDining();
}

/* ---------------------------------------------------------------------------
   Room service
   --------------------------------------------------------------------------- */

const RoomServiceSchema = z.object({
  roomServiceHours: text(3, 40, 'The hours'),
  roomServiceNote: z.string().trim().max(160, 'The note is too long.'),
});

export async function saveRoomService(prevState: DiningFormState, formData: FormData): Promise<DiningFormState> {
  await requireAdmin();
  const parsed = RoomServiceSchema.safeParse({
    roomServiceHours: formData.get('roomServiceHours') ?? '',
    roomServiceNote: formData.get('roomServiceNote') ?? '',
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, error: 'Please fix the highlighted fields.' };

  const data = { roomServiceHours: parsed.data.roomServiceHours, roomServiceNote: parsed.data.roomServiceNote || null };
  await prisma.setting.upsert({ where: { id: SETTINGS_ID }, update: data, create: { id: SETTINGS_ID, ...data } });
  revalidateDining();
  return { saved: Date.now() };
}

/* ---------------------------------------------------------------------------
   Gallery
   --------------------------------------------------------------------------- */

const MAX_GALLERY_PHOTOS = 24;

export async function uploadDiningPhotos(prevState: DiningFormState, formData: FormData): Promise<DiningFormState> {
  await requireAdmin();
  const files = formData.getAll('photos').filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length === 0) return { error: 'Choose one or more photos first.' };
  for (const file of files) {
    const problem = validateImageFile(file);
    if (problem) return { error: problem };
  }

  const count = await prisma.diningPhoto.count();
  if (count + files.length > MAX_GALLERY_PHOTOS) return { error: `The gallery can hold up to ${MAX_GALLERY_PHOTOS} photos.` };

  const last = await prisma.diningPhoto.findFirst({ orderBy: { position: 'desc' }, select: { position: true } });
  let position = (last?.position ?? -1) + 1;
  for (const file of files) {
    const uploaded = await uploadDiningImage(file);
    await prisma.diningPhoto.create({ data: { url: uploaded.url, publicId: uploaded.publicId, position: position++ } });
  }
  revalidateDining();
  return { saved: Date.now() };
}

export async function updateDiningPhoto(id: string, formData: FormData) {
  await requireAdmin();
  const caption = String(formData.get('caption') ?? '').trim().slice(0, 80);
  await prisma.diningPhoto.updateMany({ where: { id }, data: { caption: caption || null } });
  revalidateDining();
}

export async function moveDiningPhoto(id: string, direction: 'up' | 'down') {
  await requireAdmin();
  await swapPositions('diningPhoto', id, direction);
  revalidateDining();
}

export async function deleteDiningPhoto(id: string) {
  await requireAdmin();
  const photo = await prisma.diningPhoto.findUnique({ where: { id } });
  if (!photo) return;
  await prisma.diningPhoto.delete({ where: { id } });
  await removeDiningImageFile({ url: photo.url, publicId: photo.publicId });
  revalidateDining();
}

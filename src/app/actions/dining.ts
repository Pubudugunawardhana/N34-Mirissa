'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
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

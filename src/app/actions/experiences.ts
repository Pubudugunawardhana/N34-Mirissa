'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { removeExperienceImageFile, uploadExperienceImage, validateImageFile } from '@/lib/uploads';

export type ExperienceFormState = { error?: string; errors?: Record<string, string[] | undefined>; saved?: number };

function revalidateExperiences() {
  revalidatePath('/experiences');
  revalidatePath('/admin/experiences');
}

const text = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label} is too short.`).max(max, `${label} is too long.`);

const ExperienceSchema = z.object({
  title: text(3, 60, 'The title'),
  category: z.enum(['OCEAN', 'CULTURE', 'ADVENTURE', 'WELLNESS'], 'Choose a category.'),
  description: text(10, 600, 'The description'),
  highlights: z.array(z.string().trim().max(80, 'Keep each highlight short.')).max(6, 'Up to 6 highlights.'),
  // Optional: without a price the experience shows on the page, but guests cannot request it yet.
  price: z.union([
    z.literal(''),
    z.coerce.number('Enter a price in LKR.').positive('The price must be more than 0.').max(10_000_000, 'The price is too high.'),
  ]),
  priceUnit: z.enum(['PER_PERSON', 'PER_COUPLE', 'PER_GROUP'], 'Choose how the price is counted.'),
  duration: z.string().trim().max(40, 'Keep the duration short.'),
  bestTime: z.string().trim().max(60, 'Keep the best time short.'),
});

function readExperience(formData: FormData) {
  const parsed = ExperienceSchema.safeParse({
    title: formData.get('title') ?? '',
    category: formData.get('category') ?? '',
    description: formData.get('description') ?? '',
    // One highlight per line in the form.
    highlights: String(formData.get('highlights') ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    price: String(formData.get('price') ?? '').trim(),
    priceUnit: formData.get('priceUnit') ?? '',
    duration: formData.get('duration') ?? '',
    bestTime: formData.get('bestTime') ?? '',
  });
  if (!parsed.success) {
    const problem: ExperienceFormState = { errors: z.flattenError(parsed.error).fieldErrors, error: 'Please fix the highlighted fields.' };
    return { problem };
  }
  const { price, ...rest } = parsed.data;
  return { data: { ...rest, price: price === '' ? null : price, duration: rest.duration || null, bestTime: rest.bestTime || null } };
}

// Uploads the chosen photo, if any. Returns a problem to show, or the stored image.
async function readPhoto(formData: FormData) {
  const photo = formData.get('photo');
  if (!(photo instanceof File) || photo.size === 0) return {};
  const message = validateImageFile(photo);
  if (message) {
    const problem: ExperienceFormState = { errors: { photo: [message] }, error: message };
    return { problem };
  }
  const uploaded = await uploadExperienceImage(photo);
  return { image: { imageUrl: uploaded.url, imagePublicId: uploaded.publicId } };
}

export async function addExperience(prevState: ExperienceFormState, formData: FormData): Promise<ExperienceFormState> {
  await requireAdmin();
  const experience = readExperience(formData);
  if (experience.problem) return experience.problem;
  const photo = await readPhoto(formData);
  if (photo.problem) return photo.problem;

  const last = await prisma.experience.findFirst({ orderBy: { position: 'desc' }, select: { position: true } });
  await prisma.experience.create({ data: { ...experience.data, ...photo.image, position: (last?.position ?? -1) + 1 } });
  revalidateExperiences();
  return { saved: Date.now() };
}

export async function updateExperience(id: string, prevState: ExperienceFormState, formData: FormData): Promise<ExperienceFormState> {
  await requireAdmin();
  const current = await prisma.experience.findUnique({ where: { id } });
  if (!current) return { error: 'This experience no longer exists.' };
  const experience = readExperience(formData);
  if (experience.problem) return experience.problem;
  const photo = await readPhoto(formData);
  if (photo.problem) return photo.problem;

  await prisma.experience.update({ where: { id }, data: { ...experience.data, ...photo.image, isActive: formData.get('isActive') === 'on' } });
  // The old photo goes once the new one is saved (placeholders from /images are never deleted).
  if (photo.image && current.imageUrl) await removeExperienceImageFile({ url: current.imageUrl, publicId: current.imagePublicId });
  revalidateExperiences();
  return { saved: Date.now() };
}

export async function moveExperience(id: string, direction: 'up' | 'down') {
  await requireAdmin();
  const item = await prisma.experience.findUnique({ where: { id } });
  if (!item) return;
  const neighbour = await prisma.experience.findFirst({
    where: { position: direction === 'up' ? { lt: item.position } : { gt: item.position } },
    orderBy: { position: direction === 'up' ? 'desc' : 'asc' },
  });
  if (!neighbour) return;
  await prisma.$transaction([
    prisma.experience.update({ where: { id: item.id }, data: { position: neighbour.position } }),
    prisma.experience.update({ where: { id: neighbour.id }, data: { position: item.position } }),
  ]);
  revalidateExperiences();
}

export async function deleteExperience(id: string) {
  await requireAdmin();
  const item = await prisma.experience.findUnique({ where: { id } });
  if (!item) return;
  await prisma.experience.delete({ where: { id } });
  if (item.imageUrl) await removeExperienceImageFile({ url: item.imageUrl, publicId: item.imagePublicId });
  revalidateExperiences();
}

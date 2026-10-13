'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isFacilityIcon } from '@/components/FacilityIcon';
import { FALLBACK_FACILITY_ICON, suggestFacilityIcon } from '@/lib/facility-icons';
import { requireAdmin } from '@/lib/session';
import type { FieldErrors } from '@/lib/validation';

const MAX_NAME_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 200;

export type AmenityFormState = {
  // Changes on every successful save, so the form knows to clear itself.
  savedAt?: number;
  message?: string;
  errors?: FieldErrors;
  values?: { name: string; description: string; icon: string };
};

function revalidateAmenities() {
  revalidatePath('/admin/amenities');
  revalidatePath('/rooms');
}

function nameError(name: string) {
  if (name.length < 2) return 'Name must be at least 2 characters long';
  if (name.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or fewer`;
  return null;
}

export async function addFeature(prevState: AmenityFormState, formData: FormData): Promise<AmenityFormState> {
  await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const values = { name, description: '', icon: '' };

  const problem = nameError(name);
  if (problem) return { errors: { name: [problem] }, values };

  if (await prisma.feature.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } })) {
    return { errors: { name: [`"${name}" is already in the list`] }, values };
  }

  await prisma.feature.create({ data: { name } });
  revalidateAmenities();
  return { savedAt: Date.now() };
}

export async function deleteFeature(id: string) {
  await requireAdmin();

  await prisma.feature.deleteMany({ where: { id } });
  revalidateAmenities();
}

export async function addFacility(prevState: AmenityFormState, formData: FormData): Promise<AmenityFormState> {
  await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  // No icon sent: pick one from the name, the same way the form does while the admin types.
  const icon = String(formData.get('icon') ?? '') || suggestFacilityIcon(name) || FALLBACK_FACILITY_ICON;
  const values = { name, description, icon: String(formData.get('icon') ?? '') };

  const errors: FieldErrors = {};
  const problem = nameError(name);
  if (problem) errors.name = [problem];
  if (!isFacilityIcon(icon)) errors.icon = ['Please choose an icon'];
  if (description.length < 5) errors.description = ['Please write a short description'];
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = [`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`];
  }
  if (Object.keys(errors).length > 0) return { errors, message: 'Please fix the highlighted fields.', values };

  if (await prisma.facility.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } })) {
    return { errors: { name: [`"${name}" is already in the list`] }, values };
  }

  await prisma.facility.create({ data: { name, description, icon } });
  revalidateAmenities();
  return { savedAt: Date.now() };
}

export async function deleteFacility(id: string) {
  await requireAdmin();

  await prisma.facility.deleteMany({ where: { id } });
  revalidateAmenities();
}

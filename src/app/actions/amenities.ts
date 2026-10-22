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

// Features and facilities take the same three fields and follow the same rules.
function readAmenity(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const sentIcon = String(formData.get('icon') ?? '');
  // No icon sent: pick one from the name, the same way the form does while the admin types.
  const icon = sentIcon || suggestFacilityIcon(name) || FALLBACK_FACILITY_ICON;

  const errors: FieldErrors = {};
  if (name.length < 2) errors.name = ['Name must be at least 2 characters long'];
  else if (name.length > MAX_NAME_LENGTH) errors.name = [`Name must be ${MAX_NAME_LENGTH} characters or fewer`];
  if (!isFacilityIcon(icon)) errors.icon = ['Please choose an icon'];
  if (description.length < 5) errors.description = ['Please write a short description'];
  else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = [`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`];
  }

  return {
    data: { name, description, icon },
    values: { name, description, icon: sentIcon },
    errors: Object.keys(errors).length > 0 ? errors : null,
  };
}

function duplicateName(name: string, values: AmenityFormState['values']): AmenityFormState {
  return { errors: { name: [`"${name}" is already in the list`] }, values };
}

export async function addFeature(prevState: AmenityFormState, formData: FormData): Promise<AmenityFormState> {
  await requireAdmin();

  const { data, values, errors } = readAmenity(formData);
  if (errors) return { errors, message: 'Please fix the highlighted fields.', values };

  if (await prisma.feature.findFirst({ where: { name: { equals: data.name, mode: 'insensitive' } } })) {
    return duplicateName(data.name, values);
  }

  await prisma.feature.create({ data });
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

  const { data, values, errors } = readAmenity(formData);
  if (errors) return { errors, message: 'Please fix the highlighted fields.', values };

  if (await prisma.facility.findFirst({ where: { name: { equals: data.name, mode: 'insensitive' } } })) {
    return duplicateName(data.name, values);
  }

  await prisma.facility.create({ data });
  revalidateAmenities();
  return { savedAt: Date.now() };
}

export async function deleteFacility(id: string) {
  await requireAdmin();

  await prisma.facility.deleteMany({ where: { id } });
  revalidateAmenities();
}

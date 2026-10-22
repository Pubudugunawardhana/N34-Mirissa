'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { SETTINGS_ID } from '@/lib/hotel';
import { parseMapLocation, pinText } from '@/lib/map';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { forgetSiteStatus } from '@/lib/site-status';
import { emailSchema, phoneSchema, type FieldErrors } from '@/lib/validation';

export type SettingsFormState = { message?: string; errors?: FieldErrors; saved?: number };

// A web address for a social page; an empty box removes that icon from the site.
const linkSchema = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .max(300, 'This link is too long.')
    .refine((value) => /^https:\/\/[^\s]+\.[^\s]+$/.test(value), 'Enter the full link, starting with https://'),
]);
const optionalText = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);

const SettingsSchema = z.object({
  address: z.string().trim().min(5, 'Enter the hotel address.').max(200, 'The address is too long.'),
  // Coordinates or a full Google Maps link; saved as plain "lat,lng".
  googleMap: z
    .string()
    .trim()
    .max(2000, 'This link is too long.')
    .refine((value) => value === '' || parseMapLocation(value) !== null, {
      message: 'No location found. Paste coordinates like 5.9483, 80.4716, or open the short link and copy the full address from the browser bar.',
    })
    .transform((value) => {
      const pin = parseMapLocation(value);
      return pin ? pinText(pin) : '';
    }),
  phone: phoneSchema,
  email: emailSchema,
  whatsapp: z.union([z.literal(''), phoneSchema]),
  facebookUrl: linkSchema,
  instagramUrl: linkSchema,
  tiktokUrl: linkSchema,
  youtubeUrl: linkSchema,
  tripadvisorUrl: linkSchema,
  bookingsPausedMessage: optionalText(300),
  maintenanceMessage: optionalText(300),
});

const FIELDS = Object.keys(SettingsSchema.shape) as (keyof z.infer<typeof SettingsSchema>)[];

export async function updateSettings(prevState: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await requireAdmin();

  const parsed = SettingsSchema.safeParse(Object.fromEntries(FIELDS.map((field) => [field, String(formData.get(field) ?? '')])));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: 'Please fix the highlighted fields.' };

  // Empty boxes are saved as "not set", so the site falls back to its defaults.
  const values = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, value || null]));
  const data = {
    ...values,
    email: parsed.data.email.toLowerCase(),
    bookingsPaused: formData.get('bookingsPaused') === 'on',
    isMaintenance: formData.get('isMaintenance') === 'on',
  };

  await prisma.setting.upsert({ where: { id: SETTINGS_ID }, update: data, create: { id: SETTINGS_ID, ...data } });

  forgetSiteStatus();
  // Contact details, social icons and the booking pause show all over the site.
  revalidatePath('/', 'layout');
  return { saved: Date.now() };
}

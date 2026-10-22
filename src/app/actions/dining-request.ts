'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { formatStayDate, parseDateOnly } from '@/lib/booking';
import prisma from '@/lib/prisma';
import { readRequest } from '@/lib/validation';

export type DiningRequestState = { error?: string; errors?: Record<string, string[] | undefined>; sent?: boolean };

// A guest asks for a special dinner. It is saved as a Contact Us message, so it arrives in Admin → Messages
// and the hotel answers it with the reply that is already there.
export async function requestDiningExperience(experienceId: string, prevState: DiningRequestState, formData: FormData): Promise<DiningRequestState> {
  const parsed = readRequest(formData);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, error: 'Please fix the highlighted fields.' };

  const experience = await prisma.diningExperience.findFirst({ where: { id: experienceId, isActive: true } });
  if (!experience) return { error: 'This experience is no longer offered. Please contact us instead.' };

  const { name, email, phone, date, guests, note } = parsed.data;
  const message = [
    `Special dinner: ${experience.title}`,
    `Preferred date: ${formatStayDate(parseDateOnly(date)!)}`,
    `Guests: ${guests}`,
    ...(note ? ['', note] : []),
  ].join('\n');

  await prisma.contactMessage.create({
    data: { name, email: email.toLowerCase(), phone: phone || null, subject: `Special dinner request: ${experience.title}`, message },
  });
  revalidatePath('/admin', 'layout');
  return { sent: true };
}

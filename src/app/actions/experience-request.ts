'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { DiningRequestState } from '@/app/actions/dining-request';
import { formatStayDate, parseDateOnly } from '@/lib/booking';
import prisma from '@/lib/prisma';
import { readRequest } from '@/lib/validation';

// A guest asks the hotel to arrange an experience. It arrives in Admin → Messages, like a Contact Us message.
export async function requestExperience(experienceId: string, prevState: DiningRequestState, formData: FormData): Promise<DiningRequestState> {
  const parsed = readRequest(formData);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, error: 'Please fix the highlighted fields.' };

  // Only experiences with a price can be requested.
  const experience = await prisma.experience.findFirst({ where: { id: experienceId, isActive: true, price: { not: null } } });
  if (!experience) return { error: 'This experience is no longer offered. Please contact us instead.' };

  const { name, email, phone, date, guests, note } = parsed.data;
  const message = [
    `Experience: ${experience.title}`,
    `Preferred date: ${formatStayDate(parseDateOnly(date)!)}`,
    `Guests: ${guests}`,
    ...(note ? ['', note] : []),
  ].join('\n');

  await prisma.contactMessage.create({
    data: { name, email: email.toLowerCase(), phone: phone || null, subject: `Experience request: ${experience.title}`, message },
  });
  revalidatePath('/admin', 'layout');
  return { sent: true };
}

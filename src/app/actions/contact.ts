'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
  message: z.string().min(10),
});

export async function submitContactMessage(prevState: any, formData: FormData) {
  const validatedFields = ContactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return { success: false, message: 'Please fill out all fields correctly.' };
  }

  try {
    await prisma.contactMessage.create({
      data: validatedFields.data,
    });
    return { success: true, message: 'Your message has been sent successfully!' };
  } catch (error) {
    return { success: false, message: 'Something went wrong. Please try again.' };
  }
}

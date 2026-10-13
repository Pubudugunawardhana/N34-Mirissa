'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { emailSchema, nameSchema, phoneSchema, type FieldErrors } from '@/lib/validation';

export type ContactFormState = {
  success?: boolean;
  message?: string;
  errors?: FieldErrors;
};

const ContactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  // Optional: an empty box is fine.
  phone: z.union([z.literal(''), phoneSchema]),
  subject: z.string().trim().min(2, 'Please enter a subject').max(120, 'Subject is too long'),
  message: z.string().trim().min(10, 'Please write at least 10 characters').max(2000, 'Message is too long'),
  consent: z.literal('on', 'Please confirm that we may store your details to reply'),
});

export async function submitContactMessage(prevState: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const validatedFields = ContactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    subject: formData.get('subject'),
    message: formData.get('message'),
    consent: formData.get('consent'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Please fix the highlighted fields.',
    };
  }

  // Consent is only checked, never stored: without it nothing is saved at all.
  const { consent: _consent, phone, ...data } = validatedFields.data;

  try {
    await prisma.contactMessage.create({ data: { ...data, phone: phone || null } });
    return { success: true, message: 'Your message has been sent. We will get back to you soon.' };
  } catch (error) {
    console.error('Failed to save contact message', error);
    return { success: false, message: 'Something went wrong. Please try again.' };
  }
}

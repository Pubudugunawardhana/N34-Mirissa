'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sendVerificationEmail } from '@/lib/mail';
import { createAuthToken } from '@/lib/tokens';
import { findUserByEmail } from '@/lib/users';
import { RegisterSchema, isEmailVerificationRequired, type FieldErrors } from '@/lib/validation';

export type RegisterState = {
  success?: boolean;
  message?: string;
  errors?: FieldErrors;
  values?: { name: string; email: string };
  email?: string;
  verificationRequired?: boolean;
};

export async function registerUser(
  prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const values = {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
  };

  const validatedFields = RegisterSchema.safeParse({
    ...values,
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Please fix the highlighted fields.',
      values,
    };
  }

  const { name, email, password } = validatedFields.data;

  let userId: string;
  try {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return {
        errors: { email: ['An account with this email already exists.'] },
        message: 'An account with this email already exists. Try signing in instead.',
        values,
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If it's the first user, maybe make them an ADMIN for our testing purposes?
    // Let's just do it based on a hardcoded email or just make the first one ADMIN
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role, // The first user gets ADMIN privileges
      },
    });
    userId = user.id;
  } catch (error) {
    console.error('Failed to create user', error);
    return { message: 'Something went wrong while creating your account. Please try again.', values };
  }

  // The account exists at this point; a failed email can be retried with "resend".
  try {
    const token = await createAuthToken(userId, 'EMAIL_VERIFICATION');
    await sendVerificationEmail(email, token);
  } catch (error) {
    console.error('Failed to send verification email', error);
  }

  return {
    success: true,
    email,
    verificationRequired: isEmailVerificationRequired(),
    message: 'Your account has been created.',
  };
}

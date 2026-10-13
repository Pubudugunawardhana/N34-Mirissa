'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/mail';
import { consumeAuthToken, createAuthToken, isInResendCooldown } from '@/lib/tokens';
import { findUserByEmail } from '@/lib/users';
import { ResetPasswordSchema, emailSchema, type FieldErrors } from '@/lib/validation';

export type ForgotPasswordState = { success?: boolean; message?: string };

export type ResetPasswordState = {
  message?: string;
  errors?: FieldErrors;
  expired?: boolean;
};

export async function requestPasswordReset(
  prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  try {
    const user = await findUserByEmail(parsed.data);

    // Silently skip unknown, disabled and recently-emailed accounts: the reply below is always the same.
    if (
      user &&
      user.password &&
      user.status === 'ACTIVE' &&
      !(await isInResendCooldown(user.id, 'PASSWORD_RESET'))
    ) {
      const token = await createAuthToken(user.id, 'PASSWORD_RESET');
      await sendPasswordResetEmail(user.email, token);
    }
  } catch (error) {
    console.error('Failed to send password reset email', error);
    return { success: false, message: 'We could not send the email. Please try again shortly.' };
  }

  return {
    success: true,
    message: 'If an account exists for that email, a password reset link is on its way.',
  };
}

export async function resetPassword(
  prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const validatedFields = ResetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Please fix the highlighted fields.',
    };
  }

  const { token, password } = validatedFields.data;

  try {
    const userId = await consumeAuthToken(token, 'PASSWORD_RESET');
    if (!userId) {
      return { expired: true, message: 'This reset link is invalid or has expired. Please request a new one.' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { expired: true, message: 'This reset link is invalid or has expired. Please request a new one.' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: await bcrypt.hash(password, 10),
        // Opening the emailed link proves the address belongs to them.
        emailVerified: user.emailVerified ?? new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to reset password', error);
    return { message: 'Something went wrong. Please try again.' };
  }

  redirect('/login?reset=1');
}

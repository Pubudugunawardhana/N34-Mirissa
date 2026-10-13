'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { refreshSession } from '@/auth';
import { sendEmailChangeEmail } from '@/lib/mail';
import { requireUser } from '@/lib/session';
import { createAuthToken, isInResendCooldown } from '@/lib/tokens';
import { removeAvatarFile, uploadAvatar, validateImageFile } from '@/lib/uploads';
import { findUserByEmail } from '@/lib/users';
import { ChangePasswordSchema, ProfileSchema, emailSchema, type FieldErrors } from '@/lib/validation';

export type ProfileFormState = {
  // Changes on every successful save, so the form can show a fresh confirmation.
  savedAt?: number;
  message?: string;
  errors?: FieldErrors;
};

// Every action here changes only the signed-in user's own row: the id always comes from the session, never from the form.

export async function updateProfile(prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return { message: 'Your account could not be found. Please sign in again.' };

  const validatedFields = ProfileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') ?? '',
  });
  const errors: FieldErrors = validatedFields.success ? {} : z.flattenError(validatedFields.error).fieldErrors;

  // The email is only checked when it is being changed, so an account that signs in with a plain username can still save its name.
  const typedEmail = String(formData.get('email') ?? '').trim();
  const emailChanged = typedEmail.toLowerCase() !== user.email.toLowerCase();
  let newEmail: string | null = null;

  if (emailChanged) {
    const parsedEmail = emailSchema.safeParse(typedEmail);
    if (!parsedEmail.success) {
      errors.email = ['Please enter a valid email address'];
    } else {
      // Changing where sign-in and booking emails go needs the password again.
      const currentPassword = String(formData.get('currentPassword') ?? '');
      if (!currentPassword) {
        errors.currentPassword = ['Enter your current password to change your email'];
      } else if (!user.password || !(await bcrypt.compare(currentPassword, user.password))) {
        errors.currentPassword = ['That password is not correct'];
      } else {
        const owner = await findUserByEmail(parsedEmail.data);
        if (owner && owner.id !== user.id) errors.email = ['Another account already uses this email'];
        else newEmail = parsedEmail.data;
      }
    }
  }

  if (!validatedFields.success || Object.keys(errors).length > 0) {
    return { errors, message: 'Please fix the highlighted fields.' };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: validatedFields.data.name,
        phone: validatedFields.data.phone || null,
        // The sign-in email stays as it is until the link sent to the new address is opened.
        ...(newEmail ? { pendingEmail: newEmail } : {}),
      },
    });

    if (newEmail) {
      const token = await createAuthToken(user.id, 'EMAIL_VERIFICATION');
      await sendEmailChangeEmail(newEmail, token);
    }
  } catch (error) {
    console.error('Failed to update profile', error);
    return { message: 'Something went wrong while saving. Please try again.' };
  }

  // The navbar reads the name from the login session, so that is refreshed too.
  await refreshSession({});
  revalidatePath('/user');

  return {
    savedAt: Date.now(),
    message: newEmail
      ? `Your details are saved. We sent a link to ${newEmail}; your email changes once you open it.`
      : 'Your details are saved.',
  };
}

export async function resendEmailChange(): Promise<ProfileFormState> {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user?.pendingEmail) return { message: 'There is no email change waiting.' };

  if (await isInResendCooldown(user.id, 'EMAIL_VERIFICATION')) {
    return { message: 'Please wait a minute before requesting another link.' };
  }

  try {
    const token = await createAuthToken(user.id, 'EMAIL_VERIFICATION');
    await sendEmailChangeEmail(user.pendingEmail, token);
  } catch (error) {
    console.error('Failed to resend email change link', error);
    return { message: 'We could not send the email. Please try again shortly.' };
  }

  return { savedAt: Date.now(), message: `A new link is on its way to ${user.pendingEmail}.` };
}

export async function cancelEmailChange() {
  const sessionUser = await requireUser();

  // Removing the token as well makes any link already sent useless.
  await prisma.$transaction([
    prisma.user.update({ where: { id: sessionUser.id }, data: { pendingEmail: null } }),
    prisma.authToken.deleteMany({ where: { userId: sessionUser.id, type: 'EMAIL_VERIFICATION' } }),
  ]);
  revalidatePath('/user');
}

export async function changePassword(prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user?.password) return { message: 'Your account could not be found. Please sign in again.' };

  const validatedFields = ChangePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Please fix the highlighted fields.',
    };
  }

  const { currentPassword, password } = validatedFields.data;
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return { errors: { currentPassword: ['That password is not correct'] }, message: 'Please fix the highlighted fields.' };
  }

  try {
    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 10) } });
  } catch (error) {
    console.error('Failed to change password', error);
    return { message: 'Something went wrong while saving. Please try again.' };
  }

  return { savedAt: Date.now(), message: 'Your password has been changed.' };
}

export async function updateAvatar(prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return { message: 'Your account could not be found. Please sign in again.' };

  const file = formData.get('photo');
  if (!(file instanceof File) || file.size === 0) return { message: 'Please choose a photo.' };

  const problem = validateImageFile(file);
  if (problem) return { message: problem };

  try {
    const uploaded = await uploadAvatar(file);
    await prisma.user.update({ where: { id: user.id }, data: { image: uploaded.url, imagePublicId: uploaded.publicId } });
    // Only once the new photo is saved is the old file removed.
    if (user.image) await removeAvatarFile({ url: user.image, publicId: user.imagePublicId });
  } catch (error) {
    console.error('Failed to update profile photo', error);
    return { message: 'Something went wrong while uploading. Please try again.' };
  }

  // The navbar shows the photo from the login session.
  await refreshSession({});
  revalidatePath('/user');
  return { savedAt: Date.now(), message: 'Your profile photo has been updated.' };
}

export async function removeAvatar() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user?.image) return;

  await prisma.user.update({ where: { id: user.id }, data: { image: null, imagePublicId: null } });
  await removeAvatarFile({ url: user.image, publicId: user.imagePublicId });

  await refreshSession({});
  revalidatePath('/user');
}

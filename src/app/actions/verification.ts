'use server';

import { sendVerificationEmail } from '@/lib/mail';
import { createAuthToken, isInResendCooldown } from '@/lib/tokens';
import { findUserByEmail } from '@/lib/users';
import { emailSchema } from '@/lib/validation';

export type ResendState = { success?: boolean; message?: string };

// Same reply whether or not the address is registered, so it cannot be used to look up accounts.
const GENERIC_MESSAGE = 'If that account still needs verifying, a new link is on its way.';

export async function resendVerification(
  prevState: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  try {
    const user = await findUserByEmail(parsed.data);

    if (user && !user.emailVerified) {
      if (await isInResendCooldown(user.id, 'EMAIL_VERIFICATION')) {
        return { success: false, message: 'Please wait a minute before requesting another link.' };
      }

      const token = await createAuthToken(user.id, 'EMAIL_VERIFICATION');
      await sendVerificationEmail(user.email, token);
    }
  } catch (error) {
    console.error('Failed to resend verification email', error);
    return { success: false, message: 'We could not send the email. Please try again shortly.' };
  }

  return { success: true, message: GENERIC_MESSAGE };
}

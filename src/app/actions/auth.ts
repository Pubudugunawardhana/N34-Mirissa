'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ensureDefaultAdmin, findUserByEmail } from '@/lib/users';
import { LoginSchema } from '@/lib/validation';

export type LoginState = {
  message?: string;
  code?: 'invalid' | 'unverified' | 'disabled' | 'error';
  email?: string;
};

// Only same-site paths are allowed, so a crafted link cannot bounce the user to another site after login.
async function safeCallbackPath(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value) return null;

  try {
    const host = (await headers()).get('host');
    const url = new URL(value, `http://${host}`);
    if (url.host !== host) return null;

    const path = `${url.pathname}${url.search}`;
    if (path.startsWith('//') || path.startsWith('/login')) return null;
    return path;
  } catch {
    return null;
  }
}

// Shared by both sign-in forms. Returns the error to show, or the email that is now signed in.
async function attemptSignIn(formData: FormData): Promise<{ error: LoginState } | { email: string }> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  const email = typeof formData.get('email') === 'string' ? (formData.get('email') as string) : '';

  if (!parsed.success) {
    return { error: { code: 'invalid', message: 'Please enter a valid email and password.', email } };
  }

  try {
    await signIn('credentials', { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type !== 'CredentialsSignin') {
        return { error: { code: 'error', message: 'Something went wrong. Please try again.', email } };
      }

      const code = 'code' in error ? error.code : undefined;
      if (code === 'email_not_verified') {
        return {
          error: {
            code: 'unverified',
            message: 'Please verify your email address before signing in. Check your inbox for the link.',
            email: parsed.data.email,
          },
        };
      }
      if (code === 'account_disabled') {
        return { error: { code: 'disabled', message: 'This account has been disabled. Please contact the hotel.', email } };
      }
      return { error: { code: 'invalid', message: 'Invalid email or password.', email } };
    }
    throw error;
  }

  return { email: parsed.data.email };
}

export async function authenticate(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = typeof formData.get('email') === 'string' ? (formData.get('email') as string) : '';

  // Staff accounts only sign in through the admin page. Checked before signing in so no session is created,
  // and answered like a wrong password so this page does not reveal which accounts are staff.
  const user = email ? await findUserByEmail(email.trim()) : null;
  if (user?.role === 'ADMIN') {
    return { code: 'invalid', message: 'Invalid email or password.', email };
  }

  const result = await attemptSignIn(formData);
  if ('error' in result) return result.error;

  const callbackPath = await safeCallbackPath(formData.get('callbackUrl'));
  redirect(callbackPath && !callbackPath.startsWith('/admin') ? callbackPath : '/');
}

// The staff sign-in page: only admin accounts are let through.
export async function authenticateAdmin(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = typeof formData.get('email') === 'string' ? (formData.get('email') as string) : '';
  const password = typeof formData.get('password') === 'string' ? (formData.get('password') as string) : '';

  await ensureDefaultAdmin();

  // Checked before signing in, so a guest account never gets a session from this page.
  // Only said once the password is right, so it does not reveal which emails are registered.
  const user = email ? await findUserByEmail(email.trim()) : null;
  if (user?.password && user.role !== 'ADMIN' && (await bcrypt.compare(password, user.password))) {
    return { code: 'invalid', message: 'This account does not have admin access.', email };
  }

  const result = await attemptSignIn(formData);
  if ('error' in result) return result.error;

  redirect('/admin');
}

export async function logout() {
  await signOut({ redirectTo: '/' });
}

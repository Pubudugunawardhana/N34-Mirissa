'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { findUserByEmail } from '@/lib/users';
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

export async function authenticate(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  const email = typeof formData.get('email') === 'string' ? (formData.get('email') as string) : '';

  if (!parsed.success) {
    return { code: 'invalid', message: 'Please enter a valid email and password.', email };
  }

  try {
    await signIn('credentials', { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type !== 'CredentialsSignin') {
        return { code: 'error', message: 'Something went wrong. Please try again.', email };
      }

      const code = 'code' in error ? error.code : undefined;
      if (code === 'email_not_verified') {
        return {
          code: 'unverified',
          message: 'Please verify your email address before signing in. Check your inbox for the link.',
          email: parsed.data.email,
        };
      }
      if (code === 'account_disabled') {
        return { code: 'disabled', message: 'This account has been disabled. Please contact the hotel.', email };
      }
      return { code: 'invalid', message: 'Invalid email or password.', email };
    }
    throw error;
  }

  const callbackPath = await safeCallbackPath(formData.get('callbackUrl'));
  const user = await findUserByEmail(parsed.data.email);
  const isAdmin = user?.role === 'ADMIN';

  if (callbackPath && (isAdmin || !callbackPath.startsWith('/admin'))) redirect(callbackPath);
  redirect(isAdmin ? '/admin' : '/');
}

export async function logout() {
  await signOut({ redirectTo: '/' });
}

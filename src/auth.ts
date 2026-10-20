import NextAuth, { CredentialsSignin } from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { findUserByEmail } from '@/lib/users';
import { LoginSchema, isEmailVerificationRequired } from '@/lib/validation';

export class EmailNotVerifiedError extends CredentialsSignin {
  code = 'email_not_verified';
}

export class AccountDisabledError extends CredentialsSignin {
  code = 'account_disabled';
}

export const { auth, signIn, signOut, unstable_update: refreshSession, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);

      // After a profile change the name, email and photo are re-read from the database.
      // Whatever the browser sent with the update request is ignored on purpose.
      if (params.trigger === 'update' && token.sub) {
        const user = await prisma.user.findUnique({ where: { id: token.sub } });
        if (user) {
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
        }
      }
      return token;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = LoginSchema.safeParse(credentials);
        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;
        const user = await findUserByEmail(email);

        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        // Checked only after the password matches, so these messages never confirm an account to a stranger.
        if (user.status === 'INACTIVE') throw new AccountDisabledError();
        if (isEmailVerificationRequired() && !user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});

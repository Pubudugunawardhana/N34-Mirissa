import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const { auth: proxy } = NextAuth(authConfig);

export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.mp4$|.*\\.jpg$).*)'],
};

import type { NextAuthConfig } from 'next-auth';

const GUEST_ONLY_ROUTES = ['/login', '/register', '/forgot-password'];
const SIGNED_IN_ROUTES = ['/user', '/book'];

function matches(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === 'ADMIN';
      const { pathname } = nextUrl;

      if (matches(pathname, ['/admin'])) {
        if (!isLoggedIn) return false; // Redirect unauthenticated users to login page
        if (!isAdmin) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      if (matches(pathname, SIGNED_IN_ROUTES)) return isLoggedIn;

      if (isLoggedIn && matches(pathname, GUEST_ONLY_ROUTES)) {
        return Response.redirect(new URL(isAdmin ? '/admin' : '/', nextUrl));
      }

      return true;
    },
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    }
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;

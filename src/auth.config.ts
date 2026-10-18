import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';
import { isMaintenanceOn } from '@/lib/site-status';

const GUEST_ONLY_ROUTES = ['/login', '/register', '/forgot-password'];
// Booking is open to everyone: a guest can book without an account.
const SIGNED_IN_ROUTES = ['/user'];

// Still reachable while the website is in maintenance mode, so staff can sign in and switch it off.
const MAINTENANCE_OPEN_ROUTES = ['/admin', '/admin-login', '/maintenance', '/api'];

function matches(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === 'ADMIN';
      const { pathname } = nextUrl;

      // Maintenance mode: visitors see the maintenance page at whatever address they asked for; admins see the site.
      if (!isAdmin && !matches(pathname, MAINTENANCE_OPEN_ROUTES) && (await isMaintenanceOn())) {
        return NextResponse.rewrite(new URL('/maintenance', nextUrl));
      }

      if (matches(pathname, ['/admin'])) {
        // Staff have their own sign-in page, separate from the guest one.
        if (!isAdmin) return Response.redirect(new URL('/admin-login', nextUrl));
        return true;
      }

      if (pathname === '/admin-login' && isAdmin) {
        return Response.redirect(new URL('/admin', nextUrl));
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

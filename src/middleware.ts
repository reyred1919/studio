
import NextAuth from 'next-auth';
import { authOptions } from './lib/auth';

const { auth } = NextAuth(authOptions);

export default auth;

export const config = {
  // Applying the middleware to all routes except for static assets,
  // internal Next.js paths, and the public landing/login pages.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|$).*)',
  ],
};

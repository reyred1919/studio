
import { auth } from '@/lib/auth';

export default auth;

export const config = {
  // Applying the middleware to all routes except for static assets,
  // internal Next.js paths, and public pages like login or landing.
  matcher: [
    '/dashboard/:path*',
    '/objectives/:path*',
    '/teams/:path*',
    '/tasks/:path*',
    '/calendar/:path*',
    '/timeline/:path*',
    '/', // Match the root of the app
  ],
};

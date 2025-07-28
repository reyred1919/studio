
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// This middleware is temporarily simplified for prototyping.
// It avoids complex dependencies that can cause issues in the Edge Runtime.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Applying the middleware to all routes except for static assets
  // and internal Next.js paths.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

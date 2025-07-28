import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const session = await auth();

  const isAuthRoute = ['/login', '/signup'].includes(nextUrl.pathname);
  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = isAuthRoute || isApiAuthRoute || nextUrl.pathname === '/';

  // UTM Parameter Handling
  const utm_source = nextUrl.searchParams.get('utm_source');
  const utm_medium = nextUrl.searchParams.get('utm_medium');
  const utm_campaign = nextUrl.searchParams.get('utm_campaign');

  const response = NextResponse.next();

  if (utm_campaign === 'TEAMINVITATION' && utm_source && utm_medium) {
    // Set cookies for the invitation
    response.cookies.set('utm_source', utm_source, { path: '/', httpOnly: true, maxAge: 3600 }); // 1 hour expiry
    response.cookies.set('utm_medium', utm_medium, { path: '/', httpOnly: true, maxAge: 3600 });
    response.cookies.set('utm_campaign', utm_campaign, { path: '/', httpOnly: true, maxAge: 3600 });

    // Clean the URL for the user
    const cleanedUrl = new URL(nextUrl.pathname, request.url);
    return NextResponse.redirect(cleanedUrl, { headers: response.headers });
  }

  // Authentication Logic
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api/auth/register|_next/static|_next/image|favicon.ico).*)'],
};
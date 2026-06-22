import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth-token';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected pages (exact or prefix match)
  const protectedPaths = ['/', '/evaluasi', '/hasil', '/knowledge-base', '/profile'];
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  const isLoginPage = pathname === '/login';

  // Read session token from cookie
  const tokenCookie = request.cookies.get('session_token');
  const token = tokenCookie?.value;

  // Verify token (checks structure, expiry, and signature)
  const session = token ? await verifyToken(token) : null;

  if (isProtectedPath) {
    if (!session) {
      // Redirect to login, saving the original destination for post-login redirect
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isLoginPage) {
    if (session) {
      // Already logged in — redirect to dashboard
      const dashboardUrl = new URL('/', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (.png, .jpg, .svg, .ico, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
};


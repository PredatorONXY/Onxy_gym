import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('onxy_auth_token')?.value;

  // Protect /admin: if unauthenticated, redirect directly to /auth/login
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res;
    }
  }

  const response = NextResponse.next();

  // Prevent browser caching on sensitive dashboard and profile routes so browser Back does not leak cached data
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile')
  ) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/dashboard/:path*', '/profile', '/profile/:path*'],
};

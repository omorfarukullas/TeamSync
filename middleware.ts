import { NextResponse } from 'next/server';
import { auth } from './lib/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in and visiting login page '/', redirect to dashboard
  if (pathname === '/') {
    if (isLoggedIn) {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

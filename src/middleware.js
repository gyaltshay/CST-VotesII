import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  try {
    const path = request.nextUrl.pathname;

    // Always allow access to root path
    if (path === '/') {
      return NextResponse.next();
    }

    const token = await getToken({ req: request });
    const isAuthenticated = !!token;
    const isAdmin = token?.role === 'ADMIN';

    // Skip middleware for API routes and static files
    if (path.startsWith('/api/') || 
        path.startsWith('/_next/') || 
        path.startsWith('/fonts/') || 
        path.startsWith('/icons/') ||
        /\.(ico|png|jpg|jpeg|svg|css|js)$/.test(path)) {
      return NextResponse.next();
    }

    // Public paths that don't require authentication
    const publicPaths = [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/help',
      '/admin/login',
      '/api/auth',
      '/verify-2fa',
      '/verify-email'
    ];

    // Admin-only paths
    const adminPaths = [
      '/admin',
      '/admin/dashboard',
      '/admin/candidates',
      '/admin/positions',
      '/admin/settings',
      '/admin/users'
    ];

    // Allow public paths
    if (publicPaths.some(p => path.startsWith(p))) {
      // If user is already authenticated and tries to access login/register
      if (isAuthenticated && (path === '/login' || path === '/register')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      // If admin is already authenticated and tries to access admin login
      if (isAuthenticated && isAdmin && path === '/admin/login') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Check authentication for protected routes
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin access for admin routes
    if (adminPaths.some(p => path.startsWith(p))) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }

    // Check if voting is allowed (based on time and user status)
    if (path.startsWith('/vote')) {
      try {
        const votingStatus = await fetch(new URL('/api/election/status', request.url));
        const { isActive } = await votingStatus.json();

        if (!isActive) {
          return NextResponse.redirect(new URL('/results', request.url));
        }
      } catch (error) {
        console.error('Failed to check voting status:', error);
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of error, allow the request to proceed
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts (inside /public)
     * 4. /icons (inside /public)
     * 5. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|fonts|icons|[\\w-]+\\.\\w+).*)',
  ],
};
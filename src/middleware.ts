import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequestWithAuth } from 'next-auth/middleware';

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard': ['ADMIN', 'CUSTOMER', 'GENERAL_CONTRACTOR', 'SUBCONTRACTOR', 'SUPPLIER'],
  '/supplier': ['SUPPLIER'],
  '/supplier/products': ['SUPPLIER'],
  '/contractor': ['GENERAL_CONTRACTOR'],
  '/subcontractor': ['SUBCONTRACTOR'],
} as const;

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Check if the path is protected
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  );

  // If it's not a protected route, allow the request
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // If no token exists, redirect to login
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Check role-based access
  const userRole = token.role as string;
  const allowedRoles = Object.entries(protectedRoutes).find(([route]) => 
    pathname.startsWith(route)
  )?.[1];

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/supplier/:path*',
    '/contractor/:path*',
    '/subcontractor/:path*',
  ],
}; 
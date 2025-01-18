import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function superAdminMiddleware(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token || token.role !== 'SUPER_ADMIN') {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Unauthorized: Super Admin access required' 
      }),
      { 
        status: 403,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  return NextResponse.next();
}

// Matcher for crawler-related routes
export const config = {
  matcher: [
    '/api/admin/crawler/:path*',
    '/admin/crawler/:path*'
  ]
}; 
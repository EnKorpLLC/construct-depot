import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import logger from '@/lib/logger';
import { logSecurityEvent } from '@/lib/securityLogger';
import { securityConfig } from '@/config/security';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const requestMetadata = {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip: request.ip,
    geo: request.geo,
  };

  // Log the incoming request
  logger.info('Incoming request', requestMetadata);

  const response = NextResponse.next();
  const headers = response.headers;

  // 1. Basic Security Headers
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set(
    'Strict-Transport-Security',
    `max-age=${securityConfig.headers.strictTransportSecurity.maxAge}; includeSubDomains; preload`
  );
  headers.set('X-Frame-Options', securityConfig.headers.frameOptions);
  headers.set('X-Content-Type-Options', securityConfig.headers.contentTypeOptions);
  headers.set('Referrer-Policy', securityConfig.headers.referrerPolicy);
  
  // Build Permissions-Policy header
  const permissionsPolicy = Object.entries(securityConfig.headers.permissionsPolicy)
    .map(([key, value]) => `${key}=(${value.join(' ')})`)
    .join(', ');
  headers.set('Permissions-Policy', permissionsPolicy);

  // 2. CORS Headers (for API routes)
  if (request.url.includes('/api/')) {
    const origin = request.headers.get('origin');
    
    if (origin && securityConfig.cors.origins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Methods', securityConfig.cors.methods.join(', '));
      headers.set('Access-Control-Allow-Headers', securityConfig.cors.allowedHeaders.join(', '));
      headers.set('Access-Control-Max-Age', securityConfig.cors.maxAge.toString());
    } else if (origin) {
      // Log CORS violation
      logSecurityEvent(
        'CORS_VIOLATION',
        'Invalid CORS origin',
        {
          ...requestMetadata,
          origin,
        }
      );
    }
  }

  // 3. Content Security Policy
  const cspDirectives = Object.entries(securityConfig.csp.directives)
    .map(([key, value]) => `${key} ${value.join(' ')}`)
    .join('; ');

  const cspHeader = `${cspDirectives}; block-all-mixed-content; upgrade-insecure-requests`;
  
  if (securityConfig.csp.reportOnly) {
    headers.set('Content-Security-Policy-Report-Only', cspHeader);
  } else {
    headers.set('Content-Security-Policy', cspHeader);
  }

  // Check for potential security issues
  const referer = request.headers.get('referer');
  if (referer && !securityConfig.cors.origins.includes(new URL(referer).origin)) {
    logSecurityEvent(
      'SUSPICIOUS_ACTIVITY',
      'Suspicious referer detected',
      {
        ...requestMetadata,
        referer,
      }
    );
  }

  // Check for potential header tampering
  const securityHeaders = [
    'x-frame-options',
    'content-security-policy',
    'strict-transport-security',
  ];

  securityHeaders.forEach(header => {
    const clientHeader = request.headers.get(header);
    if (clientHeader) {
      logSecurityEvent(
        'HEADER_VIOLATION',
        'Client attempted to send security header',
        {
          ...requestMetadata,
          header,
          value: clientHeader,
        }
      );
    }
  });

  // Log the response
  const duration = Date.now() - startTime;
  logger.info('Request completed', {
    ...requestMetadata,
    duration,
    status: response.status,
    statusText: response.statusText,
  });

  // Add request ID to response headers for tracking
  headers.set('X-Request-ID', requestId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 
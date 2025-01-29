export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'object-src': string[];
  [key: string]: string[];
}

export interface SecurityHeaders {
  'Strict-Transport-Security': string;
  'X-Frame-Options': 'DENY' | 'SAMEORIGIN';
  'X-Content-Type-Options': 'nosniff';
  'Referrer-Policy': 'strict-origin-when-cross-origin' | 'no-referrer';
  'Permissions-Policy': string;
  'Content-Security-Policy'?: string;
  'Content-Security-Policy-Report-Only'?: string;
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Methods'?: string;
  'Access-Control-Allow-Headers'?: string;
  'Access-Control-Max-Age'?: number;
  [key: string]: string | number | undefined;
}

export interface SecurityConfig {
  cors: {
    origins: string[];
    methods: string[];
    allowedHeaders: string[];
    maxAge: number;
  };
  csp: {
    reportOnly: boolean;
    directives: CSPDirectives;
  };
  headers: {
    hstsMaxAge: number;
    frameOptions: 'DENY' | 'SAMEORIGIN';
    contentTypeOptions: 'nosniff';
    referrerPolicy: 'strict-origin-when-cross-origin' | 'no-referrer';
    permissionsPolicy: string;
  };
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    message: string;
  };
}

export const securityConfig: SecurityConfig = {
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  },
  csp: {
    reportOnly: process.env.NODE_ENV !== 'production',
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https:'],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
    },
  },
  headers: {
    hstsMaxAge: 31536000, // 1 year
    frameOptions: 'SAMEORIGIN',
    contentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later.',
  },
}; 
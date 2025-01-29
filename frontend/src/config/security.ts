export const securityConfig = {
  cors: {
    // List of allowed origins for CORS
    origins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    // Methods allowed for CORS requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // Headers allowed in requests
    allowedHeaders: ['Content-Type', 'Authorization'],
    // How long browsers should cache CORS headers
    maxAge: 86400, // 24 hours
  },

  // Rate limiting configuration
  rateLimit: {
    // Default window size in seconds
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10) * 1000,
    // Maximum number of requests per window
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    // Message when rate limit is exceeded
    message: 'Too many requests, please try again later.',
  },

  // Content Security Policy configuration
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"], // Required for Next.js
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'blob:', 'data:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      // Add any additional trusted domains here
      connectSrc: [
        "'self'",
        process.env.NEXT_PUBLIC_API_URL || '',
        process.env.NEXT_PUBLIC_APP_URL || '',
      ].filter(Boolean),
    },
    reportOnly: process.env.NODE_ENV !== 'production',
  },

  // HTTP Security Headers
  headers: {
    // HSTS configuration
    strictTransportSecurity: {
      maxAge: 63072000, // 2 years in seconds
      includeSubDomains: true,
      preload: true,
    },
    // Frame options to prevent clickjacking
    frameOptions: 'SAMEORIGIN',
    // Content type options to prevent MIME-type sniffing
    contentTypeOptions: 'nosniff',
    // Referrer policy configuration
    referrerPolicy: 'strict-origin-when-cross-origin',
    // Permissions policy configuration
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      'interest-cohort': [], // Opt out of FLoC
    },
  },

  // Authentication configuration
  auth: {
    // Maximum failed login attempts before lockout
    maxLoginAttempts: 5,
    // Lockout duration in minutes
    lockoutDuration: 15,
    // Password requirements
    passwordRequirements: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
  },
} as const; 
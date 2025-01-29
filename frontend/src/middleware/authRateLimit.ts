import { NextApiRequest, NextApiResponse } from 'next';
import { RateLimitService, authRateLimits } from '@/lib/services/RateLimitService';

export async function authRateLimitMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  const rateLimitService = RateLimitService.getInstance();
  const path = req.url?.split('?')[0] || '';

  // Determine which rate limit config to use based on the endpoint
  let config;
  if (path.endsWith('/api/auth/login')) {
    config = authRateLimits.login;
  } else if (path.endsWith('/api/auth/register')) {
    config = authRateLimits.register;
  } else if (path.endsWith('/api/auth/password-reset')) {
    config = authRateLimits.passwordReset;
  } else if (path.endsWith('/api/auth/verify-email')) {
    config = authRateLimits.emailVerification;
  } else {
    // No rate limiting for other endpoints
    return next();
  }

  return rateLimitService.middleware(config)(req, res, next);
}

// Helper to wrap API routes with rate limiting
export function withAuthRateLimit(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    return new Promise<void>((resolve) => {
      authRateLimitMiddleware(req, res, async () => {
        await handler(req, res);
        resolve();
      });
    });
  };
} 
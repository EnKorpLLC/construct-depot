import { NextResponse } from 'next/server';
import { logSecurityEvent } from '@/lib/securityLogger';

export async function GET(request: Request) {
  // Log test event
  logSecurityEvent(
    'AUTH_SUCCESS',
    'Test endpoint accessed',
    {
      path: '/api/test',
      method: 'GET',
      timestamp: new Date().toISOString(),
    },
    'info'
  );

  return NextResponse.json({
    message: 'Test endpoint successful',
    timestamp: new Date().toISOString(),
  });
} 
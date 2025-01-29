
import { NextResponse } from 'next/server';
import { checkDatabase } from '@/lib/db';
import { checkRedis } from '@/lib/redis';
import { getSystemMetrics } from '@/lib/metrics';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      api: true
    },
    metrics: await getSystemMetrics()
  };
  
  return NextResponse.json(health);
}
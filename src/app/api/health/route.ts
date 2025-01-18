import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();

    const metrics = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      },
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    };

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Determine which service failed
    const services = {
      database: 'unknown',
      redis: 'unknown'
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      services.database = 'connected';
    } catch {
      services.database = 'disconnected';
    }

    try {
      await redis.ping();
      services.redis = 'connected';
    } catch {
      services.redis = 'disconnected';
    }

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services,
      message: 'Service partially available',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
} 
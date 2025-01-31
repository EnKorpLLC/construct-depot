import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    // Set a test value
    await redis.set('test-key', 'Hello from Upstash Redis!');
    
    // Get the test value
    const value = await redis.get('test-key');
    
    // Delete the test value (cleanup)
    await redis.del('test-key');
    
    return NextResponse.json({
      success: true,
      message: 'Redis connection successful',
      testValue: value
    });
  } catch (error) {
    console.error('Redis test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 
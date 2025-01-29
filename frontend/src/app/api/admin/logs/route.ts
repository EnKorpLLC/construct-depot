import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import logger from '@/lib/logger';

export async function GET(request: Request) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      logger.warn('Unauthorized logs access attempt', {
        userId: session?.user?.id,
        timestamp: new Date().toISOString(),
      });
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const type = searchParams.get('type') || 'combined';

    // Validate log type
    const validTypes = ['error', 'combined', 'admin', 'exceptions', 'rejections'];
    if (!validTypes.includes(type)) {
      return new NextResponse('Invalid log type', { status: 400 });
    }

    // Construct log file path
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, `${type}-${date}.log`);

    // Check if file exists
    try {
      await fs.access(logFile);
    } catch {
      return NextResponse.json({ logs: [] });
    }

    // Read and parse log file
    const content = await fs.readFile(logFile, 'utf-8');
    const logs = content
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));

    // Log the access
    logger.admin('Admin accessed logs', {
      adminId: session.user.id,
      logType: type,
      date,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ logs });
  } catch (error) {
    logger.error('Error accessing logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
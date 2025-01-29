import { NextResponse } from 'next/server';
import logger from '@/lib/logger';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Ensure logs directory exists
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Test different log levels
  logger.error('Test error message', { 
    context: 'test-logging',
    timestamp: new Date().toISOString()
  });

  logger.warn('Test warning message', {
    context: 'test-logging',
    timestamp: new Date().toISOString()
  });

  logger.info('Test info message', {
    context: 'test-logging',
    timestamp: new Date().toISOString()
  });

  logger.debug('Test debug message', {
    context: 'test-logging',
    timestamp: new Date().toISOString()
  });

  // Log HTTP request (this will be handled by Winston's HTTP transport)
  logger.http('Test HTTP request', {
    method: 'GET',
    path: '/api/test-logging',
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({
    message: 'Logging test completed successfully',
    timestamp: new Date().toISOString(),
    logLevels: ['error', 'warn', 'info', 'debug', 'http']
  });
} 
import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Ensure security logs directory exists
const logDir = path.join(process.cwd(), 'logs', 'security');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const securityLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'security-service' },
  transports: [
    // Write all security logs to rotating files
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.SECURITY_LOG_MAX_SIZE || '10m',
      maxFiles: process.env.SECURITY_LOG_RETENTION_DAYS || '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Separate file for errors
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'security-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.SECURITY_LOG_MAX_SIZE || '10m',
      maxFiles: process.env.SECURITY_LOG_RETENTION_DAYS || '30d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  securityLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT_BREACH'
  | 'CSP_VIOLATION'
  | 'CORS_VIOLATION'
  | 'HEADER_VIOLATION'
  | 'SUSPICIOUS_ACTIVITY';

export interface SecurityLogMetadata {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  origin?: string;
  [key: string]: any;
}

export const logSecurityEvent = (
  eventType: SecurityEventType,
  message: string,
  metadata: SecurityLogMetadata,
  level: string = 'warn'
) => {
  securityLogger.log(level, message, {
    eventType,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

export default securityLogger; 
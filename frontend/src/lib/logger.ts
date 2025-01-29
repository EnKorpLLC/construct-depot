import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configure daily rotate transport options
const dailyRotateOptions = {
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d', // Keep logs for 14 days
  maxSize: '20m', // Rotate when file reaches 20MB
  auditFile: path.join(logDir, 'audit.json'),
  zippedArchive: true, // Compress rotated files
};

// Create the logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Error logs - daily rotate
    new winston.transports.DailyRotateFile({
      ...dailyRotateOptions,
      filename: path.join(logDir, 'error-%DATE%.log'),
      level: 'error',
    }),
    // Combined logs - daily rotate
    new winston.transports.DailyRotateFile({
      ...dailyRotateOptions,
      filename: path.join(logDir, 'combined-%DATE%.log'),
    }),
    // Admin activity logs - daily rotate
    new winston.transports.DailyRotateFile({
      ...dailyRotateOptions,
      filename: path.join(logDir, 'admin-%DATE%.log'),
      level: 'info',
    }),
  ],
  // Handle errors that occur while logging
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      ...dailyRotateOptions,
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      ...dailyRotateOptions,
      filename: path.join(logDir, 'rejections-%DATE%.log'),
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Add admin logging method
const adminLogger = {
  ...logger,
  admin: (message: string, metadata: any) => {
    return logger.info(message, { 
      ...metadata, 
      logType: 'ADMIN_ACTION',
      timestamp: new Date().toISOString()
    });
  }
};

export default adminLogger;
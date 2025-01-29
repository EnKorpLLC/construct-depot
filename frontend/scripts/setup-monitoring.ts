import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const MONITORING_CONFIG = {
  dependencies: [
    'winston@3.11.0',
    'winston-daily-rotate-file@4.7.1',
    'morgan@1.10.0',
    '@types/morgan@1.9.9'
  ],
};

function installDependencies() {
  console.log('Installing monitoring dependencies...');
  try {
    execSync(`npm install ${MONITORING_CONFIG.dependencies.join(' ')} --save --legacy-peer-deps`, { stdio: 'inherit' });
    console.log('Successfully installed dependencies');
  } catch (error) {
    console.error('Failed to install dependencies:', error);
    throw error;
  }
}

function createLoggerConfig() {
  console.log('Creating logger configuration...');
  const loggerCode = `import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

const logDir = path.join(process.cwd(), 'logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d'
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d'
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;`;

  const middlewareCode = `import morgan from 'morgan';
import logger from './logger';

export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message) => logger.http(message.trim())
    }
  }
);`;

  try {
    const libDir = path.join(process.cwd(), 'src', 'lib');
    fs.mkdirSync(libDir, { recursive: true });
    
    fs.writeFileSync(path.join(libDir, 'logger.ts'), loggerCode);
    fs.writeFileSync(path.join(libDir, 'morganMiddleware.ts'), middlewareCode);
    
    console.log('Successfully created logger configuration');
  } catch (error) {
    console.error('Failed to create logger configuration:', error);
    throw error;
  }
}

function updateNextConfig() {
  console.log('Updating Next.js configuration...');
  try {
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Add logging directory to output directories
    if (!nextConfig.includes('logs')) {
      nextConfig = nextConfig.replace(
        /experimental: {/,
        `experimental: {
    outputFileTracingExcludes: {
      '*': [
        'logs/**'
      ]
    },`
      );
    }
    
    fs.writeFileSync(nextConfigPath, nextConfig);
    console.log('Successfully updated Next.js configuration');
  } catch (error) {
    console.error('Failed to update Next.js configuration:', error);
    throw error;
  }
}

function setupMonitoring() {
  console.log('Starting monitoring setup...');
  
  // Install dependencies
  installDependencies();
  
  // Create logger configuration
  createLoggerConfig();
  
  // Update Next.js configuration
  updateNextConfig();
  
  console.log('Monitoring setup completed successfully');
  console.log('\nTo use the logger in your code:');
  console.log('1. Import the logger: import logger from "@/lib/logger"');
  console.log('2. Use logging levels: logger.info(), logger.error(), logger.debug(), etc.');
  console.log('\nTo use Morgan middleware in API routes:');
  console.log('1. Import the middleware: import { morganMiddleware } from "@/lib/morganMiddleware"');
  console.log('2. Add to your API route: app.use(morganMiddleware)');
}

// Run the setup
setupMonitoring(); 
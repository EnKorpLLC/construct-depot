import http from 'http';
import { securityConfig } from '../src/config/security';
import logger from '../src/lib/logger';

interface Headers {
  [key: string]: string | string[] | number | undefined;
}

interface SecurityEvent {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function verifySecuritySetup(): Promise<void> {
  try {
    // Log CORS configuration
    const configuredOrigins = process.env.CORS_ORIGINS?.split(',') || [];
    logger.info('CORS Configuration', {
      configuredOrigins,
      configOrigins: securityConfig.cors.origins
    });

    // Create test server
    const server = http.createServer((req, res) => {
      try {
        const headers: Headers = {};

        // Set security headers
        headers['Strict-Transport-Security'] = `max-age=${securityConfig.headers.hstsMaxAge}`;
        headers['X-Frame-Options'] = securityConfig.headers.frameOptions;
        headers['X-Content-Type-Options'] = securityConfig.headers.contentTypeOptions;
        headers['Referrer-Policy'] = securityConfig.headers.referrerPolicy;
        headers['Permissions-Policy'] = securityConfig.headers.permissionsPolicy;

        // Add CSP header
        const cspHeader = Object.entries(securityConfig.csp.directives)
          .map(([key, value]) => `${key} ${value.join(' ')}`)
          .join('; ');

        const cspHeaderKey = securityConfig.csp.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
        headers[cspHeaderKey] = cspHeader;

        // Add CORS headers if origin matches
        const origin = req.headers.origin;
        if (origin && securityConfig.cors.origins.includes(origin)) {
          headers['Access-Control-Allow-Origin'] = origin;
          headers['Access-Control-Allow-Methods'] = securityConfig.cors.methods.join(', ');
          headers['Access-Control-Allow-Headers'] = securityConfig.cors.allowedHeaders.join(', ');
          headers['Access-Control-Max-Age'] = securityConfig.cors.maxAge;
        }

        // Set all headers
        Object.entries(headers).forEach(([key, value]) => {
          if (value !== undefined) {
            res.setHeader(key, value);
          }
        });

        // Log security event
        const securityEvent: SecurityEvent = {
          level: 'info',
          message: 'Security headers set successfully',
          timestamp: new Date().toISOString(),
          details: { headers }
        };
        logger.info(securityEvent.message, securityEvent);

        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', headers }));
      } catch (error) {
        const errorEvent: SecurityEvent = {
          level: 'error',
          message: 'Error setting security headers',
          timestamp: new Date().toISOString(),
          details: { error: handleError(error) }
        };
        logger.error(errorEvent.message, errorEvent);

        res.writeHead(500);
        res.end(JSON.stringify({ status: 'error', message: 'Internal server error' }));
      }
    });

    // Start server
    server.listen(3456, () => {
      logger.info('Security verification server started on port 3456');
      console.log('\nTest server running on port 3456');
      console.log('Use the following commands to test:');
      console.log('1. Basic request:\ncurl -v http://localhost:3456\n');
      console.log('2. CORS request:\ncurl -v -H "Origin: http://localhost:3001" http://localhost:3456\n');
      
      // Auto-shutdown after 30 seconds
      setTimeout(() => {
        try {
          server.close();
          logger.info('Security verification server shut down');
        } catch (error) {
          logger.error('Error shutting down verification server', {
            error: handleError(error)
          });
        }
      }, 30000);
    });

    server.on('error', (error) => {
      logger.error('Server error', {
        error: handleError(error)
      });
    });
  } catch (error) {
    logger.error('Verification setup error', {
      error: handleError(error)
    });
  }
}

verifySecuritySetup(); 
import { securityConfig } from '../src/config/security';
import { logSecurityEvent } from '../src/lib/securityLogger';
import http from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';

interface SecurityHeaders {
  'Strict-Transport-Security': string;
  'X-Frame-Options': 'SAMEORIGIN';
  'X-Content-Type-Options': 'nosniff';
  'Referrer-Policy': 'strict-origin-when-cross-origin';
  'Content-Security-Policy'?: string;
  'Content-Security-Policy-Report-Only'?: string;
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Methods'?: string;
  'Access-Control-Allow-Headers'?: string;
  'Access-Control-Max-Age'?: string;
}

interface SecurityConfig {
  csp: {
    reportOnly: boolean;
    directives: Record<string, string[]>;
  };
  cors: {
    origins: string[];
    methods: readonly ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    allowedHeaders: readonly ['Content-Type', 'Authorization'];
    maxAge: number;
  };
}

async function verifySecuritySetup() {
  console.log('Starting security verification...\n');

  try {
    // 1. Verify CORS configuration
    console.log('CORS Configuration:');
    const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [];
    console.log('- Configured Origins:', corsOrigins);
    console.log('- Config Origins:', securityConfig.cors.origins);
    if (corsOrigins.length === 0) {
      logSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        'No CORS origins configured',
        { severity: 'high' },
        'warn'
      );
    }

    // 2. Create test server to verify headers
    const server = http.createServer((req, res) => {
      try {
        // Log request
        logSecurityEvent(
          'AUTH_SUCCESS',
          'Test request received',
          {
            method: req.method,
            url: req.url,
            headers: req.headers,
          },
          'info'
        );

        // Set security headers
        const headers: SecurityHeaders = {
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        };

        // Set CSP header
        const cspDirectives = Object.entries(securityConfig.csp.directives)
          .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
          .join('; ');
        const cspHeader = `${cspDirectives}; block-all-mixed-content; upgrade-insecure-requests`;
        
        if (securityConfig.csp.reportOnly) {
          headers['Content-Security-Policy-Report-Only'] = cspHeader;
        } else {
          headers['Content-Security-Policy'] = cspHeader;
        }

        // Handle CORS
        const origin = req.headers.origin;
        if (origin && securityConfig.cors.origins.includes(origin)) {
          headers['Access-Control-Allow-Origin'] = origin;
          headers['Access-Control-Allow-Methods'] = securityConfig.cors.methods.join(', ');
          headers['Access-Control-Allow-Headers'] = securityConfig.cors.allowedHeaders.join(', ');
          headers['Access-Control-Max-Age'] = securityConfig.cors.maxAge.toString();
        }

        // Set all headers
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        // Send response
        res.writeHead(200);
        res.end(JSON.stringify({
          message: 'Security headers verified',
          headers: headers,
          timestamp: new Date().toISOString(),
        }, null, 2));
      } catch (error) {
        console.error('Error handling request:', error);
        logSecurityEvent(
          'SUSPICIOUS_ACTIVITY',
          'Error in test server',
          { error: error.message },
          'error'
        );
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });

    // Start server
    const port = 3456;
    await new Promise<void>((resolve, reject) => {
      server.on('error', (error) => {
        console.error('Server error:', error);
        reject(error);
      });

      server.listen(port, () => {
        console.log(`\nTest server running on port ${port}`);
        console.log('Use the following commands to test:');
        console.log(`1. Basic request:\ncurl -v http://localhost:${port}\n`);
        console.log(`2. CORS request:\ncurl -v -H "Origin: http://localhost:3001" http://localhost:${port}\n`);
        resolve();
      });
    });

    // Keep server running for 30 seconds
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        server.close(() => {
          console.log('\nTest server shut down');
          resolve();
        });
      }, 30000);
    });
  } catch (error) {
    console.error('Error in security verification:', error);
    logSecurityEvent(
      'SUSPICIOUS_ACTIVITY',
      'Security verification failed',
      { error: error.message },
      'error'
    );
  }
}

verifySecuritySetup().catch(console.error);

export function configureSecurityHeaders(
  req: NextApiRequest,
  res: NextApiResponse,
  securityConfig: SecurityConfig
): void {
  try {
    // Initialize headers
    const headers: SecurityHeaders = {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    // Configure CSP
    if (securityConfig.csp) {
      const cspDirectives = Object.entries(securityConfig.csp.directives)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');

      const cspHeader = `${cspDirectives}; block-all-mixed-content; upgrade-insecure-requests`;

      if (securityConfig.csp.reportOnly) {
        headers['Content-Security-Policy-Report-Only'] = cspHeader;
      } else {
        headers['Content-Security-Policy'] = cspHeader;
      }

      // Handle CORS
      const origin = req.headers.origin;
      if (origin && securityConfig.cors.origins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', securityConfig.cors.methods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', securityConfig.cors.allowedHeaders.join(', '));
        res.setHeader('Access-Control-Max-Age', securityConfig.cors.maxAge.toString());
      }

      // Set all headers
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }
  } catch (error) {
    console.error('Failed to configure security headers:', error);
    throw error;
  }
} 
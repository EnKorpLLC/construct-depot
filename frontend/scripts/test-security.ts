const { securityConfig } = require('../src/config/security');

function validateSecurityConfig() {
  console.log('Validating Security Configuration...\n');

  // Check CORS configuration
  console.log('CORS Configuration:');
  console.log('- Origins:', securityConfig.cors.origins);
  console.log('- Methods:', securityConfig.cors.methods);
  console.log('- Headers:', securityConfig.cors.allowedHeaders);
  console.log('- Max Age:', securityConfig.cors.maxAge);
  console.log();

  // Check CSP configuration
  console.log('Content Security Policy:');
  Object.entries(securityConfig.csp.directives).forEach(([key, value]) => {
    console.log(`- ${key}:`, (value as string[]).join(' '));
  });
  console.log('- Report Only:', securityConfig.csp.reportOnly);
  console.log();

  // Check Security Headers
  console.log('Security Headers:');
  console.log('- HSTS Max Age:', securityConfig.headers.strictTransportSecurity.maxAge);
  console.log('- Frame Options:', securityConfig.headers.frameOptions);
  console.log('- Content Type Options:', securityConfig.headers.contentTypeOptions);
  console.log('- Referrer Policy:', securityConfig.headers.referrerPolicy);
  console.log('- Permissions Policy:');
  Object.entries(securityConfig.headers.permissionsPolicy).forEach(([key, value]) => {
    console.log(`  * ${key}:`, (value as string[]).join(' '));
  });
  console.log();

  // Check Authentication Security
  console.log('Authentication Security:');
  console.log('- Max Login Attempts:', securityConfig.auth.maxLoginAttempts);
  console.log('- Lockout Duration:', securityConfig.auth.lockoutDuration);
  console.log('- Password Requirements:');
  Object.entries(securityConfig.auth.passwordRequirements).forEach(([key, value]) => {
    console.log(`  * ${key}:`, value);
  });
}

validateSecurityConfig(); 
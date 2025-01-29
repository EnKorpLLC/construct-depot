#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  checks: {
    docs: true,
    style: true,
    deps: true,
    security: true,
    types: true,
    tests: true
  },
  thresholds: {
    testCoverage: 80,
    docCoverage: 90,
    maxDependencyAge: 365 // days
  }
};

// Utility functions
const runCommand = (command, errorMessage) => {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ ${errorMessage}`);
    console.error(error.message);
    return false;
  }
};

const checkExists = (path) => {
  try {
    fs.accessSync(path);
    return true;
  } catch {
    return false;
  }
};

// Verification checks
const verifyDocs = () => {
  console.log('📝 Verifying documentation...');
  
  // Check required documentation files
  const requiredDocs = [
    'README.md',
    'docs/getting-started.md',
    'docs/architecture.md',
    'docs/api/README.md'
  ];

  const missingDocs = requiredDocs.filter(doc => !checkExists(doc));
  if (missingDocs.length > 0) {
    console.error('❌ Missing required documentation:', missingDocs.join(', '));
    return false;
  }

  // Run documentation linting if configured
  return runCommand('npm run docs:lint', 'Documentation validation failed');
};

const verifyStyle = () => {
  console.log('🎨 Verifying code style...');
  return runCommand('npm run lint', 'Code style verification failed');
};

const verifyDependencies = () => {
  console.log('📦 Verifying dependencies...');
  return runCommand('npm audit', 'Dependency audit failed') &&
         runCommand('npm outdated', 'Dependency version check failed');
};

const verifySecurityChecks = () => {
  console.log('🔒 Running security checks...');
  return runCommand('npm audit --audit-level=moderate', 'Security audit failed');
};

const verifyTypes = () => {
  console.log('📋 Verifying types...');
  return runCommand('npm run type-check', 'Type checking failed');
};

const verifyTests = () => {
  console.log('🧪 Verifying tests...');
  return runCommand('npm run test:coverage', 'Test coverage verification failed');
};

// Main verification function
const runVerification = async () => {
  console.log('🚀 Starting verification process...');
  
  const results = {
    docs: true,
    style: true,
    deps: true,
    security: true,
    types: true,
    tests: true
  };

  if (config.checks.docs) {
    results.docs = verifyDocs();
  }

  if (config.checks.style) {
    results.style = verifyStyle();
  }

  if (config.checks.deps) {
    results.deps = verifyDependencies();
  }

  if (config.checks.security) {
    results.security = verifySecurityChecks();
  }

  if (config.checks.types) {
    results.types = verifyTypes();
  }

  if (config.checks.tests) {
    results.tests = verifyTests();
  }

  // Summary
  console.log('\n📋 Verification Summary:');
  Object.entries(results).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
  });

  const allPassed = Object.values(results).every(result => result);
  if (allPassed) {
    console.log('\n✨ All verifications passed!');
    process.exit(0);
  } else {
    console.error('\n❌ Some verifications failed');
    process.exit(1);
  }
};

// Run verification
runVerification().catch(error => {
  console.error('❌ Verification process failed:', error);
  process.exit(1);
}); 
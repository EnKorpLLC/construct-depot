import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

interface EnvVariable {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'url';
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
}

const ENV_SCHEMA: EnvVariable[] = [
  // Application
  { name: 'NODE_ENV', required: true, type: 'string', pattern: /^(development|production|test)$/ },
  { name: 'PORT', required: true, type: 'number', minValue: 1, maxValue: 65535 },
  { name: 'HOST', required: true, type: 'string' },

  // Database
  { name: 'DB_HOST', required: true, type: 'string' },
  { name: 'DB_PORT', required: true, type: 'number', minValue: 1, maxValue: 65535 },
  { name: 'DB_NAME', required: true, type: 'string', minLength: 1 },
  { name: 'DB_USER', required: true, type: 'string', minLength: 1 },
  { name: 'DB_PASSWORD', required: true, type: 'string', minLength: 8 },

  // Authentication
  { name: 'JWT_SECRET', required: true, type: 'string', minLength: 32 },
  { name: 'JWT_EXPIRATION', required: true, type: 'string', pattern: /^\d+[hdwmy]$/ },
  { name: 'API_KEY', required: true, type: 'string', minLength: 32 },

  // External Services
  { name: 'API_URL', required: true, type: 'url' },
  { name: 'WEBHOOK_URL', required: true, type: 'url' },

  // Logging
  { name: 'LOG_LEVEL', required: true, type: 'string', pattern: /^(error|warn|info|debug)$/ },
  { name: 'LOG_FILE', required: true, type: 'string' },

  // Security
  { name: 'CORS_ORIGIN', required: true, type: 'string' },
  { name: 'RATE_LIMIT_WINDOW', required: true, type: 'string', pattern: /^\d+[smhd]$/ },
  { name: 'RATE_LIMIT_MAX', required: true, type: 'number', minValue: 1 },

  // AI Development
  { name: 'AI_LOG_LEVEL', required: true, type: 'string', pattern: /^(error|warn|info|debug)$/ },
  { name: 'AI_LOG_DIR', required: true, type: 'string' },
  { name: 'TEMPLATE_VERSION', required: true, type: 'string', pattern: /^\d+\.\d+\.\d+$/ },

  // Feature Flags
  { name: 'ENABLE_FEATURE_X', required: false, type: 'boolean' },
  { name: 'ENABLE_FEATURE_Y', required: false, type: 'boolean' },

  // Documentation
  { name: 'DOC_BASE_URL', required: true, type: 'url' },
  { name: 'API_DOC_URL', required: true, type: 'url' },

  // Testing
  { name: 'TEST_DB_NAME', required: false, type: 'string' },
  { name: 'TEST_API_KEY', required: false, type: 'string', minLength: 32 },

  // Monitoring
  { name: 'METRICS_PORT', required: true, type: 'number', minValue: 1, maxValue: 65535 },
  { name: 'HEALTH_CHECK_PATH', required: true, type: 'string', pattern: /^\/[\w-/]*$/ }
];

function validateUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validateValue(variable: EnvVariable, value: string | undefined): string[] {
  const errors: string[] = [];

  // Check if required
  if (variable.required && !value) {
    errors.push(`${variable.name} is required`);
    return errors;
  }

  // Skip validation if value is not provided and not required
  if (!value) {
    return errors;
  }

  // Type validation
  switch (variable.type) {
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${variable.name} must be a number`);
      } else {
        if (variable.minValue !== undefined && num < variable.minValue) {
          errors.push(`${variable.name} must be >= ${variable.minValue}`);
        }
        if (variable.maxValue !== undefined && num > variable.maxValue) {
          errors.push(`${variable.name} must be <= ${variable.maxValue}`);
        }
      }
      break;

    case 'boolean':
      if (!/^(true|false)$/i.test(value)) {
        errors.push(`${variable.name} must be true or false`);
      }
      break;

    case 'url':
      if (!validateUrl(value)) {
        errors.push(`${variable.name} must be a valid URL`);
      }
      break;

    case 'string':
      if (variable.pattern && !variable.pattern.test(value)) {
        errors.push(`${variable.name} does not match required pattern`);
      }
      if (variable.minLength !== undefined && value.length < variable.minLength) {
        errors.push(`${variable.name} must be at least ${variable.minLength} characters`);
      }
      if (variable.maxLength !== undefined && value.length > variable.maxLength) {
        errors.push(`${variable.name} must be at most ${variable.maxLength} characters`);
      }
      break;
  }

  return errors;
}

async function validateEnv(): Promise<void> {
  console.log('Validating environment variables...');

  // Load environment variables
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate each variable
  ENV_SCHEMA.forEach(variable => {
    const value = process.env[variable.name];
    const validationErrors = validateValue(variable, value);
    
    if (validationErrors.length > 0) {
      if (variable.required) {
        errors.push(...validationErrors);
      } else {
        warnings.push(...validationErrors);
      }
    }
  });

  // Print results
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (errors.length > 0) {
    console.error('\nErrors:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('\nEnvironment validation complete!');
  if (errors.length === 0 && warnings.length === 0) {
    console.log('All variables are valid.');
  }
}

validateEnv().catch(console.error); 
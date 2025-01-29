import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface ProductionSecrets {
  PROD_DB_PASSWORD: string;
  PROD_REDIS_PASSWORD: string;
  PROD_JWT_SECRET: string;
  PROD_ANALYTICS_KEY: string;
  PROD_SENTRY_DSN: string;
  PROD_NEW_RELIC_KEY: string;
  PROD_DATADOG_KEY: string;
  PROD_SMTP_KEY: string;
  PROD_AWS_KEY: string;
  PROD_AWS_SECRET: string;
}

function generateSecureSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

function generateProductionSecrets(): ProductionSecrets {
  return {
    PROD_DB_PASSWORD: generateSecureSecret(),
    PROD_REDIS_PASSWORD: generateSecureSecret(),
    PROD_JWT_SECRET: generateSecureSecret(64),
    PROD_ANALYTICS_KEY: '', // To be filled with actual analytics key
    PROD_SENTRY_DSN: '',   // To be filled with actual Sentry DSN
    PROD_NEW_RELIC_KEY: '', // To be filled with actual New Relic key
    PROD_DATADOG_KEY: '',   // To be filled with actual Datadog key
    PROD_SMTP_KEY: '',      // To be filled with actual SendGrid key
    PROD_AWS_KEY: '',       // To be filled with actual AWS key
    PROD_AWS_SECRET: '',    // To be filled with actual AWS secret
  };
}

function saveSecrets(secrets: ProductionSecrets): void {
  // Save to a secure location (e.g., AWS Secrets Manager, HashiCorp Vault)
  // For now, we'll save to a local file that should be properly secured
  const secretsPath = path.join(__dirname, '..', 'config', 'production', 'secrets.json');
  fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));
  console.log('Production secrets generated and saved.');
  console.log('WARNING: Make sure to:');
  console.log('1. Store these secrets securely in your production environment');
  console.log('2. Never commit secrets.json to version control');
  console.log('3. Fill in actual values for external service keys');
}

// Add secrets to .gitignore
function updateGitignore(): void {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  const secretsIgnore = '\n# Production Secrets\nconfig/production/secrets.json\n';
  
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    if (!content.includes('config/production/secrets.json')) {
      fs.appendFileSync(gitignorePath, secretsIgnore);
    }
  } else {
    fs.writeFileSync(gitignorePath, secretsIgnore);
  }
}

function main(): void {
  const secrets = generateProductionSecrets();
  saveSecrets(secrets);
  updateGitignore();
}

if (require.main === module) {
  main();
} 
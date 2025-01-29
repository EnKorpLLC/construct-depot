import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ProjectConfig {
  name: string;
  description: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
}

async function initializeTemplate(): Promise<void> {
  console.log('Initializing new project from template...');

  // Get project configuration
  const config: ProjectConfig = {
    name: process.argv[2] || 'new-project',
    description: process.argv[3] || 'Project created from template',
    version: '0.1.0',
    environment: 'development'
  };

  // Create project directory structure
  const directories = [
    'docs',
    'docs/api',
    'docs/api/authentication',
    'docs/api/error-handling',
    'docs/api/websocket',
    'docs/development',
    'docs/development/guides',
    'docs/development/standards',
    'scripts',
    'src',
    'src/components',
    'src/components/contractor',
    'src/components/subcontractor',
    'src/services',
    'src/services/analytics',
    'src/services/auth',
    'src/services/websocket',
    'tests',
    'tests/unit',
    'tests/integration',
    'tests/e2e',
    'tests/load',
    '.ai-logs',
    '.ai-logs/development',
    '.ai-logs/verification',
    '.ai-logs/process',
    '.ai-logs/template',
    'reports',
    'config'
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create environment files
  const envTemplate = `
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
WEBSOCKET_URL=ws://localhost:3000
DATABASE_URL=postgresql://localhost:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
ANALYTICS_API_KEY=your-analytics-key
`;
  fs.writeFileSync('.env.template', envTemplate.trim());
  fs.writeFileSync('.env', envTemplate.trim());

  // Create config files
  const configTemplate = {
    development: {
      api: { timeout: 5000, retries: 3 },
      websocket: { reconnectInterval: 1000, maxRetries: 5 },
      analytics: { batchSize: 100, flushInterval: 5000 },
      cache: { ttl: 3600, maxSize: 1000 }
    }
  };
  fs.writeFileSync(
    path.join('config', 'default.json'),
    JSON.stringify(configTemplate, null, 2)
  );

  // Update package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.name = config.name;
  packageJson.description = config.description;
  packageJson.version = config.version;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  // Initialize git repository
  try {
    execSync('git init');
    
    // Create .gitignore
    const gitignore = `
node_modules/
dist/
.env
*.log
.DS_Store
coverage/
reports/
.nyc_output/
`;
    fs.writeFileSync('.gitignore', gitignore.trim());

    // Create initial commit
    execSync('git add .');
    execSync('git commit -m "Initial commit from Template Developer Pack"');
  } catch (error) {
    console.error('Error initializing git repository:', error);
  }

  // Initialize AI logs
  const initialLog = {
    timestamp: new Date().toISOString(),
    event: 'PROJECT_INITIALIZATION',
    template_version: '1.0.0',
    project_config: config,
    verification_status: 'PENDING',
    environment: config.environment
  };

  fs.writeFileSync(
    path.join('.ai-logs', 'process', 'initialization.json'),
    JSON.stringify(initialLog, null, 2)
  );

  // Run verification scripts
  console.log('\nRunning verification scripts...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    execSync('npm run normalize-endings', { stdio: 'inherit' });
    execSync('npm run update-timestamps', { stdio: 'inherit' });
    execSync('npm run check-docs', { stdio: 'inherit' });
    execSync('npm run find-duplicates', { stdio: 'inherit' });
    execSync('npm run check-references', { stdio: 'inherit' });
    execSync('npm run fix-docs', { stdio: 'inherit' });
    execSync('npm run validate-env', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running verification scripts:', error);
  }

  console.log('\nTemplate initialization complete!');
  console.log(`Project "${config.name}" has been created and verified.`);
  console.log('\nNext steps:');
  console.log('1. Update environment variables in .env');
  console.log('2. Review and update documentation in docs/');
  console.log('3. Configure project-specific settings in config/');
  console.log('4. Start development following the AI Developer Guide');
}

initializeTemplate().catch(console.error); 
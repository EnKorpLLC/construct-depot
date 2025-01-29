import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

interface DependencyCheckResult {
  passed: boolean;
  message: string;
  details?: any;
}

interface DependencyCheckSummary {
  allPassed: boolean;
  results: {
    [key: string]: DependencyCheckResult;
  };
}

export class TestDependencyChecker {
  private prisma: PrismaClient;
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.prisma = new PrismaClient();
  }

  async checkAll(): Promise<DependencyCheckSummary> {
    const results: { [key: string]: DependencyCheckResult } = {
      environment: await this.checkEnvironmentVariables(),
      packages: await this.checkPackageDependencies(),
      config: await this.checkConfigurationFiles(),
      database: await this.checkDatabaseConnection(),
      mocks: await this.checkMockSetup(),
      filesystem: await this.checkFileSystem(),
    };

    const allPassed = Object.values(results).every(result => result.passed);

    return {
      allPassed,
      results,
    };
  }

  private async checkEnvironmentVariables(): Promise<DependencyCheckResult> {
    const requiredEnvVars = [
      'NEXT_PUBLIC_API_URL',
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    return {
      passed: missingVars.length === 0,
      message: missingVars.length === 0
        ? 'All required environment variables are present'
        : `Missing environment variables: ${missingVars.join(', ')}`,
      details: { missingVars },
    };
  }

  private async checkPackageDependencies(): Promise<DependencyCheckResult> {
    try {
      const packageJson = require(path.join(this.rootDir, 'package.json'));
      const nodeModulesExists = fs.existsSync(path.join(this.rootDir, 'node_modules'));

      const requiredDependencies = [
        '@testing-library/react',
        '@testing-library/jest-dom',
        'jest',
        'typescript',
      ];

      const missingDeps = requiredDependencies.filter(dep => {
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
        return !allDeps[dep];
      });

      return {
        passed: nodeModulesExists && missingDeps.length === 0,
        message: nodeModulesExists && missingDeps.length === 0
          ? 'All required packages are installed'
          : `Missing dependencies: ${missingDeps.join(', ')}`,
        details: { missingDeps, nodeModulesExists },
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Failed to check package dependencies',
        details: error,
      };
    }
  }

  private async checkConfigurationFiles(): Promise<DependencyCheckResult> {
    const requiredConfigs = [
      { path: 'jest.config.js', name: 'Jest configuration' },
      { path: 'tsconfig.json', name: 'TypeScript configuration' },
      { path: 'next.config.js', name: 'Next.js configuration' },
      { path: '.eslintrc.json', name: 'ESLint configuration' },
    ];

    const missingConfigs = requiredConfigs.filter(
      config => !fs.existsSync(path.join(this.rootDir, config.path))
    );

    return {
      passed: missingConfigs.length === 0,
      message: missingConfigs.length === 0
        ? 'All required configuration files are present'
        : `Missing configuration files: ${missingConfigs.map(c => c.name).join(', ')}`,
      details: { missingConfigs },
    };
  }

  private async checkDatabaseConnection(): Promise<DependencyCheckResult> {
    try {
      await this.prisma.$connect();
      await this.prisma.$disconnect();

      return {
        passed: true,
        message: 'Database connection successful',
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Failed to connect to database',
        details: error,
      };
    }
  }

  private async checkMockSetup(): Promise<DependencyCheckResult> {
    const setupFiles = [
      'src/__tests__/setup.ts',
      'src/__tests__/mocks/handlers.ts',
      'src/__tests__/utils/test-utils.tsx',
    ];

    const missingFiles = setupFiles.filter(
      file => !fs.existsSync(path.join(this.rootDir, file))
    );

    // Check if global mocks are configured
    const hasGlobalMocks = global.fetch && global.localStorage;

    return {
      passed: missingFiles.length === 0 && hasGlobalMocks,
      message: missingFiles.length === 0 && hasGlobalMocks
        ? 'Mock setup is complete'
        : 'Missing mock setup files or global mocks',
      details: { missingFiles, hasGlobalMocks },
    };
  }

  private async checkFileSystem(): Promise<DependencyCheckResult> {
    const requiredDirs = [
      'src/__tests__',
      'src/components',
      'src/services',
      'public',
    ];

    const missingDirs = requiredDirs.filter(
      dir => !fs.existsSync(path.join(this.rootDir, dir))
    );

    // Check write permissions in test directories
    let hasWritePermissions = true;
    try {
      const testFile = path.join(this.rootDir, 'src/__tests__', '.write-test');
      fs.writeFileSync(testFile, '');
      fs.unlinkSync(testFile);
    } catch (error) {
      hasWritePermissions = false;
    }

    return {
      passed: missingDirs.length === 0 && hasWritePermissions,
      message: missingDirs.length === 0 && hasWritePermissions
        ? 'File system checks passed'
        : 'File system checks failed',
      details: { missingDirs, hasWritePermissions },
    };
  }
}

// Export a helper function to run checks before tests
export async function validateTestEnvironment(rootDir: string): Promise<void> {
  const checker = new TestDependencyChecker(rootDir);
  const results = await checker.checkAll();

  if (!results.allPassed) {
    console.error('Test environment validation failed:');
    Object.entries(results.results).forEach(([key, result]) => {
      if (!result.passed) {
        console.error(`❌ ${key}: ${result.message}`);
        if (result.details) {
          console.error('Details:', result.details);
        }
      }
    });
    throw new Error('Test environment is not properly configured');
  }
} 
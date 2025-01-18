import fs from 'fs';
import path from 'path';

interface QuarantinedTest {
  testPath: string;
  testName: string;
  failureCount: number;
  firstFailure: string;
  lastFailure: string;
  errorMessage: string;
  skipReason: string;
}

interface QuarantineConfig {
  maxFailures: number;
  quarantineThreshold: number;
  autoQuarantine: boolean;
}

export class TestQuarantine {
  private quarantineFile: string;
  private quarantinedTests: Map<string, QuarantinedTest>;
  private config: QuarantineConfig;

  constructor(rootDir: string, config?: Partial<QuarantineConfig>) {
    this.quarantineFile = path.join(rootDir, '.test-quarantine.json');
    this.quarantinedTests = new Map();
    this.config = {
      maxFailures: 3,
      quarantineThreshold: 2,
      autoQuarantine: true,
      ...config
    };
    this.loadQuarantinedTests();
  }

  private loadQuarantinedTests(): void {
    try {
      if (fs.existsSync(this.quarantineFile)) {
        const data = JSON.parse(fs.readFileSync(this.quarantineFile, 'utf8'));
        this.quarantinedTests = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load quarantined tests:', error);
    }
  }

  private saveQuarantinedTests(): void {
    try {
      const data = Object.fromEntries(this.quarantinedTests);
      fs.writeFileSync(this.quarantineFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save quarantined tests:', error);
    }
  }

  public recordFailure(testPath: string, testName: string, error: Error): void {
    const key = `${testPath}::${testName}`;
    const existing = this.quarantinedTests.get(key);

    if (existing) {
      existing.failureCount++;
      existing.lastFailure = new Date().toISOString();
      existing.errorMessage = error.message;
    } else {
      this.quarantinedTests.set(key, {
        testPath,
        testName,
        failureCount: 1,
        firstFailure: new Date().toISOString(),
        lastFailure: new Date().toISOString(),
        errorMessage: error.message,
        skipReason: 'Repeated failures detected'
      });
    }

    this.saveQuarantinedTests();

    // Check if test should be quarantined
    const test = this.quarantinedTests.get(key)!;
    if (this.config.autoQuarantine && test.failureCount >= this.config.quarantineThreshold) {
      this.quarantineTest(testPath, testName);
    }
  }

  public shouldSkipTest(testPath: string, testName: string): boolean {
    const key = `${testPath}::${testName}`;
    const test = this.quarantinedTests.get(key);
    return test ? test.failureCount >= this.config.quarantineThreshold : false;
  }

  public quarantineTest(testPath: string, testName: string): void {
    const key = `${testPath}::${testName}`;
    const test = this.quarantinedTests.get(key);
    
    if (test) {
      test.skipReason = 'Manually quarantined';
      this.saveQuarantinedTests();
    }
  }

  public removeFromQuarantine(testPath: string, testName: string): void {
    const key = `${testPath}::${testName}`;
    this.quarantinedTests.delete(key);
    this.saveQuarantinedTests();
  }

  public getQuarantinedTests(): QuarantinedTest[] {
    return Array.from(this.quarantinedTests.values());
  }

  public generateReport(): string {
    const tests = this.getQuarantinedTests();
    if (tests.length === 0) {
      return 'No tests in quarantine.';
    }

    let report = '# Quarantined Tests Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    tests.forEach(test => {
      report += `## ${test.testName}\n`;
      report += `Path: ${test.testPath}\n`;
      report += `Failure Count: ${test.failureCount}\n`;
      report += `First Failure: ${test.firstFailure}\n`;
      report += `Last Failure: ${test.lastFailure}\n`;
      report += `Skip Reason: ${test.skipReason}\n`;
      report += `Error Message: ${test.errorMessage}\n\n`;
    });

    return report;
  }

  public saveReport(reportPath?: string): void {
    const report = this.generateReport();
    const filePath = reportPath || path.join(path.dirname(this.quarantineFile), 'quarantine-report.md');
    
    try {
      fs.writeFileSync(filePath, report);
      console.log(`Quarantine report saved to: ${filePath}`);
    } catch (error) {
      console.error('Failed to save quarantine report:', error);
    }
  }
}

// Jest reporter for quarantine integration
export class QuarantineReporter {
  private quarantine: TestQuarantine;

  constructor(globalConfig: any, options: any) {
    this.quarantine = new TestQuarantine(process.cwd());
  }

  onTestResult(test: any, testResult: any, aggregatedResult: any) {
    testResult.testResults.forEach((result: any) => {
      if (result.status === 'failed') {
        this.quarantine.recordFailure(
          testResult.testFilePath,
          result.fullName,
          new Error(result.failureMessages.join('\n'))
        );
      }
    });
  }

  onRunComplete() {
    this.quarantine.saveReport();
  }
} 
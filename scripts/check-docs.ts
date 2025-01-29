import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';

interface DocumentCheck {
  file: string;
  issues: string[];
}

interface DocumentationReport {
  timestampIssues: DocumentCheck[];
  crossReferenceIssues: DocumentCheck[];
  structureIssues: DocumentCheck[];
  formatIssues: DocumentCheck[];
  summary: {
    totalFiles: number;
    filesWithIssues: number;
    totalIssues: number;
  };
}

class DocumentationChecker {
  private readonly docsDir: string;
  private readonly expectedStructure: string[];
  private report: DocumentationReport;

  constructor() {
    this.docsDir = path.join(process.cwd(), 'docs');
    this.expectedStructure = [
      'core',
      'api',
      'api/endpoints',
      'deployment',
      'development',
      'services',
      'testing'
    ];
    this.report = {
      timestampIssues: [],
      crossReferenceIssues: [],
      structureIssues: [],
      formatIssues: [],
      summary: {
        totalFiles: 0,
        filesWithIssues: 0,
        totalIssues: 0
      }
    };
  }

  public async check(): Promise<DocumentationReport> {
    console.log(chalk.blue('Starting documentation check...'));
    
    await this.checkStructure();
    await this.checkAllFiles();
    this.calculateSummary();
    
    return this.report;
  }

  private async checkStructure(): Promise<void> {
    console.log(chalk.gray('Checking directory structure...'));
    
    for (const dir of this.expectedStructure) {
      const fullPath = path.join(this.docsDir, dir);
      if (!fs.existsSync(fullPath)) {
        this.report.structureIssues.push({
          file: dir,
          issues: ['Directory missing']
        });
      }
    }
  }

  private async checkAllFiles(): Promise<void> {
    const files = glob.sync('**/*.md', { cwd: this.docsDir });
    this.report.summary.totalFiles = files.length;

    for (const file of files) {
      const fullPath = path.join(this.docsDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const fileIssues: string[] = [];
      
      // Check timestamp
      this.checkTimestamp(content, file);
      
      // Check cross-references
      this.checkCrossReferences(content, file);
      
      // Check formatting
      this.checkFormatting(content, file);
    }
  }

  private checkTimestamp(content: string, file: string): void {
    const timestampRegex = /Last Updated: (\d{4}-\d{2}-\d{2} \d{2}:\d{2})/;
    const match = content.match(timestampRegex);

    if (!match) {
      this.report.timestampIssues.push({
        file,
        issues: ['Missing timestamp']
      });
      return;
    }

    const timestamp = match[1];
    const year = timestamp.substring(0, 4);
    
    if (year !== '2025') {
      this.report.timestampIssues.push({
        file,
        issues: [`Incorrect year in timestamp: ${year}`]
      });
    }
  }

  private checkCrossReferences(content: string, file: string): void {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    const issues: string[] = [];

    while ((match = linkRegex.exec(content)) !== null) {
      const [, text, link] = match;
      
      if (link.startsWith('http')) continue; // Skip external links
      
      const targetPath = path.join(path.dirname(path.join(this.docsDir, file)), link);
      if (!fs.existsSync(targetPath)) {
        issues.push(`Broken cross-reference: ${link}`);
      }
    }

    if (issues.length > 0) {
      this.report.crossReferenceIssues.push({ file, issues });
    }
  }

  private checkFormatting(content: string, file: string): void {
    const issues: string[] = [];

    // Check for consistent header style
    if (content.includes('======') || content.includes('------')) {
      issues.push('Using incorrect header style (should use #)');
    }

    // Check for proper code block formatting
    const codeBlocks = content.match(/```[a-z]*\n[\s\S]*?\n```/g) || [];
    for (const block of codeBlocks) {
      if (!block.match(/```[a-z]+\n/)) {
        issues.push('Code block missing language specification');
      }
    }

    // Check for consistent spacing
    if (content.includes('\r\n')) {
      issues.push('Using Windows line endings (should use LF)');
    }

    if (issues.length > 0) {
      this.report.formatIssues.push({ file, issues });
    }
  }

  private calculateSummary(): void {
    const filesWithIssues = new Set([
      ...this.report.timestampIssues.map(i => i.file),
      ...this.report.crossReferenceIssues.map(i => i.file),
      ...this.report.structureIssues.map(i => i.file),
      ...this.report.formatIssues.map(i => i.file)
    ]);

    const totalIssues = 
      this.report.timestampIssues.reduce((sum, i) => sum + i.issues.length, 0) +
      this.report.crossReferenceIssues.reduce((sum, i) => sum + i.issues.length, 0) +
      this.report.structureIssues.reduce((sum, i) => sum + i.issues.length, 0) +
      this.report.formatIssues.reduce((sum, i) => sum + i.issues.length, 0);

    this.report.summary.filesWithIssues = filesWithIssues.size;
    this.report.summary.totalIssues = totalIssues;
  }
}

// CLI interface
if (require.main === module) {
  const checker = new DocumentationChecker();
  checker.check().then(report => {
    console.log('\nDocumentation Check Report');
    console.log('=========================');
    
    if (report.structureIssues.length > 0) {
      console.log(chalk.red('\nStructure Issues:'));
      report.structureIssues.forEach(({ file, issues }) => {
        console.log(chalk.gray(`\n${file}:`));
        issues.forEach(issue => console.log(`  - ${issue}`));
      });
    }

    if (report.timestampIssues.length > 0) {
      console.log(chalk.yellow('\nTimestamp Issues:'));
      report.timestampIssues.forEach(({ file, issues }) => {
        console.log(chalk.gray(`\n${file}:`));
        issues.forEach(issue => console.log(`  - ${issue}`));
      });
    }

    if (report.crossReferenceIssues.length > 0) {
      console.log(chalk.red('\nCross-Reference Issues:'));
      report.crossReferenceIssues.forEach(({ file, issues }) => {
        console.log(chalk.gray(`\n${file}:`));
        issues.forEach(issue => console.log(`  - ${issue}`));
      });
    }

    if (report.formatIssues.length > 0) {
      console.log(chalk.yellow('\nFormatting Issues:'));
      report.formatIssues.forEach(({ file, issues }) => {
        console.log(chalk.gray(`\n${file}:`));
        issues.forEach(issue => console.log(`  - ${issue}`));
      });
    }

    console.log('\nSummary:');
    console.log(`Total files checked: ${report.summary.totalFiles}`);
    console.log(`Files with issues: ${report.summary.filesWithIssues}`);
    console.log(`Total issues found: ${report.summary.totalIssues}`);
  });
} 
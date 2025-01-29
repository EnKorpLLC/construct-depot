import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as crypto from 'crypto';
import chalk from 'chalk';

interface DuplicateGroup {
  hash: string;
  files: string[];
  content: string;
  lineCount: number;
}

interface FileInfo {
  path: string;
  name: string;
  content: string;
  hash: string;
}

interface DuplicateReport {
  timestamp: string;
  totalFilesScanned: number;
  duplicateGroups: DuplicateGroup[];
  duplicateFilenames: {
    name: string;
    paths: string[];
  }[];
  inaccurateFiles: {
    path: string;
    issues: string[];
  }[];
  summary: {
    totalDuplicateGroups: number;
    totalDuplicateFiles: number;
    totalDuplicateLines: number;
    totalDuplicateFilenames: number;
    totalInaccurateFiles: number;
  };
}

class DuplicateCodeFinder {
  private readonly excludeDirs: string[] = [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage'
  ];

  private readonly fileExtensions: string[] = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.css',
    '.scss'
  ];

  private readonly minLines: number = 5;
  private report: DuplicateReport;

  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      totalFilesScanned: 0,
      duplicateGroups: [],
      duplicateFilenames: [],
      inaccurateFiles: [],
      summary: {
        totalDuplicateGroups: 0,
        totalDuplicateFiles: 0,
        totalDuplicateLines: 0,
        totalDuplicateFilenames: 0,
        totalInaccurateFiles: 0
      }
    };
  }

  public async findDuplicates(rootDir: string = process.cwd()): Promise<DuplicateReport> {
    console.log(chalk.blue('Starting duplicate code and filename detection...'));

    const files = this.getFiles(rootDir);
    this.report.totalFilesScanned = files.length;

    console.log(chalk.gray(`Found ${files.length} files to analyze...`));

    const contentMap = new Map<string, string[]>();
    const filenameMap = new Map<string, string[]>();
    const fileInfos: FileInfo[] = [];

    // First pass: collect all file info
    files.forEach(filePath => {
      const content = this.normalizeContent(fs.readFileSync(filePath, 'utf8'));
      const hash = this.hashContent(content);
      const name = path.basename(filePath);
      
      const fileInfo: FileInfo = { path: filePath, name, content, hash };
      fileInfos.push(fileInfo);
      
      // Check for duplicate content
      const existing = contentMap.get(hash) || [];
      existing.push(filePath);
      contentMap.set(hash, existing);
      
      // Check for duplicate filenames
      const existingNames = filenameMap.get(name) || [];
      existingNames.push(filePath);
      filenameMap.set(name, existingNames);
    });

    // Find duplicate filenames
    this.report.duplicateFilenames = [];
    for (const [name, paths] of filenameMap.entries()) {
      if (paths.length > 1) {
        this.report.duplicateFilenames.push({ name, paths });
      }
    }

    // Check file accuracy
    this.report.inaccurateFiles = [];
    fileInfos.forEach(fileInfo => {
      const issues = this.checkFileAccuracy(fileInfo);
      if (issues.length > 0) {
        this.report.inaccurateFiles.push({
          path: fileInfo.path,
          issues
        });
      }
    });

    // Calculate summary
    this.calculateSummary();

    // Save report
    this.saveReport();

    return this.report;
  }

  private getFiles(rootDir: string): string[] {
    const pattern = `**/*{${this.fileExtensions.join(',')}}`;
    return glob.sync(pattern, {
      cwd: rootDir,
      absolute: true,
      ignore: this.excludeDirs.map(dir => `**/${dir}/**`)
    });
  }

  private normalizeContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private checkFileAccuracy(fileInfo: FileInfo): string[] {
    const issues: string[] = [];
    
    // Check if file has a timestamp
    if (!fileInfo.content.includes('Last Updated:')) {
      issues.push('Missing last updated timestamp');
    }
    
    // Check if markdown files have proper headers
    if (fileInfo.path.endsWith('.md')) {
      if (!fileInfo.content.match(/^# [^\n]+/)) {
        issues.push('Missing or improper main header');
      }
    }
    
    // Check for broken internal links in markdown
    if (fileInfo.path.endsWith('.md')) {
      const links = fileInfo.content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      links.forEach(link => {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const [, , url] = match;
          if (!url.startsWith('http') && !fs.existsSync(path.resolve(path.dirname(fileInfo.path), url))) {
            issues.push(`Broken internal link: ${url}`);
          }
        }
      });
    }
    
    return issues;
  }

  private calculateSummary(): void {
    this.report.summary = {
      totalDuplicateGroups: this.report.duplicateGroups.length,
      totalDuplicateFiles: this.report.duplicateGroups.reduce(
        (sum, group) => sum + group.files.length,
        0
      ),
      totalDuplicateLines: this.report.duplicateGroups.reduce(
        (sum, group) => sum + group.lineCount,
        0
      ),
      totalDuplicateFilenames: this.report.duplicateFilenames.length,
      totalInaccurateFiles: this.report.inaccurateFiles.length
    };
  }

  private saveReport(): void {
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `duplicate-code-${timestamp}.json`);

    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(chalk.green(`\nReport saved to: ${reportPath}`));
  }
}

// CLI interface
if (require.main === module) {
  const finder = new DuplicateCodeFinder();
  finder.findDuplicates().then(report => {
    console.log('\nDuplicate Code Report');
    console.log('===================');
    console.log(`\nFiles scanned: ${report.totalFilesScanned}`);
    
    if (report.duplicateGroups.length === 0) {
      console.log(chalk.green('\nNo duplicate code found!'));
      return;
    }

    console.log(chalk.yellow(`\nFound ${report.summary.totalDuplicateGroups} groups of duplicates:`));
    
    report.duplicateGroups.forEach((group, index) => {
      console.log(chalk.white(`\nDuplicate Group ${index + 1}:`));
      console.log(chalk.gray(`Lines: ${group.lineCount}`));
      console.log(chalk.gray('Files:'));
      group.files.forEach(file => {
        console.log(`  - ${path.relative(process.cwd(), file)}`);
      });
    });

    console.log('\nSummary:');
    console.log(`Total duplicate groups: ${report.summary.totalDuplicateGroups}`);
    console.log(`Total files with duplicates: ${report.summary.totalDuplicateFiles}`);
    console.log(`Total duplicate lines: ${report.summary.totalDuplicateLines}`);
    console.log(chalk.blue('\nFull report saved to reports directory'));
  });
} 
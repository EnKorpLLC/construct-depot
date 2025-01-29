import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';

interface Reference {
  source: string;
  line: number;
  target: string;
}

interface FileAccuracy {
  path: string;
  issues: string[];
}

interface DocumentStructure {
  path: string;
  children?: { [key: string]: DocumentStructure };
}

interface ReferenceReport {
  totalFiles: number;
  totalReferences: number;
  brokenReferences: Reference[];
  duplicateFilenames: {
    name: string;
    paths: string[];
    correctPath?: string;
  }[];
  inaccurateFiles: FileAccuracy[];
  structureViolations: {
    file: string;
    correctLocation: string;
  }[];
}

interface DocumentMetadata {
  title: string;
  lastUpdated?: Date;
  category?: string;
  tags: string[];
  sections: string[];
}

interface DocumentAnalysis {
  filename: string;
  content: string;
  metadata: DocumentMetadata;
  references: Reference[];
  referencedBy: string[];
  headers: string[];
}

type DocumentType = 
  | 'api-endpoint'
  | 'api-auth'
  | 'api-error'
  | 'api-websocket'
  | 'api-caching'
  | 'development-guide'
  | 'development-script'
  | 'development-standard'
  | 'development-operation'
  | 'core'
  | 'unknown';

export class ReferenceChecker {
  private readonly excludeDirs: string[] = [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage'
  ];

  private report: ReferenceReport = {
    totalFiles: 0,
    totalReferences: 0,
    brokenReferences: [],
    duplicateFilenames: [],
    inaccurateFiles: [],
    structureViolations: []
  };

  private documentStructure: DocumentStructure;

  constructor() {
    // Parse README to get intended structure
    const readmeContent = fs.readFileSync('README.md', 'utf8');
    this.documentStructure = this.parseDocumentStructure(readmeContent);
  }

  private parseDocumentStructure(readmeContent: string): DocumentStructure {
    const structure: DocumentStructure = {
      path: 'docs',
      children: {}
    };

    // Find the Project Structure section
    const structureMatch = readmeContent.match(/## Project Structure\n([\s\S]*?)(?=\n##|$)/);
    if (!structureMatch) return structure;

    const structureSection = structureMatch[1];
    const lines = structureSection.split('\n').filter(line => line.trim());

    let currentPath: string[] = [];
    let currentLevel = 0;
    let currentNode = structure;

    lines.forEach(line => {
      const match = line.match(/^(\s*)[-*]\s+`?([^`]+)`?/);
      if (!match) return;

      const [, indent, name] = match;
      const level = indent.length / 2;

      // Adjust current path based on indentation level
      if (level > currentLevel) {
        currentPath.push(name);
      } else if (level < currentLevel) {
        currentPath = currentPath.slice(0, level);
        currentPath[level] = name;
      } else {
        currentPath[level] = name;
      }
      currentLevel = level;

      // Build structure
      let node = structure;
      for (let i = 0; i < currentPath.length; i++) {
        const pathPart = currentPath[i];
        if (!node.children) node.children = {};
        if (!node.children[pathPart]) {
          node.children[pathPart] = {
            path: path.join('docs', ...currentPath.slice(0, i + 1))
          };
        }
        node = node.children[pathPart];
      }
    });

    return structure;
  }

  private analyzeDocument(filePath: string, content: string): DocumentAnalysis {
    return {
      filename: path.basename(filePath),
      content,
      metadata: this.extractMetadata(content),
      references: this.extractReferences(content),
      referencedBy: this.findReferencingFiles(filePath),
      headers: this.extractHeaders(content)
    };
  }

  private extractMetadata(content: string): DocumentMetadata {
    const lines = content.split('\n');
    const title = lines.find(line => line.startsWith('# '))?.substring(2) || '';
    const lastUpdatedMatch = content.match(/Last Updated:\s*(.+)/);
    const lastUpdated = lastUpdatedMatch ? new Date(lastUpdatedMatch[1]) : undefined;
    
    const tags: string[] = [];
    if (content.includes('API') || content.includes('Endpoint')) tags.push('api');
    if (content.includes('Authentication') || content.includes('Auth')) tags.push('auth');
    if (content.includes('Error') || content.includes('Exception')) tags.push('error');
    if (content.includes('WebSocket') || content.includes('Socket')) tags.push('websocket');
    if (content.includes('Cache') || content.includes('Caching')) tags.push('caching');
    if (content.includes('Guide') || content.includes('Tutorial')) tags.push('guide');
    
    const sections = this.extractHeaders(content);
    
    return { title, lastUpdated, tags, sections };
  }

  private extractHeaders(content: string): string[] {
    const headerRegex = /^#{1,6}\s+(.+)$/gm;
    const headers: string[] = [];
    let match;
    while ((match = headerRegex.exec(content)) !== null) {
      headers.push(match[1].trim());
    }
    return headers;
  }

  private extractReferences(content: string): Reference[] {
    const references: Reference[] = [];
    const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    
    links.forEach(link => {
      const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        const [, text, target] = match;
        if (!target.startsWith('http')) {
          references.push({
            source: '',  // Will be set by caller
            line: this.findLineNumber(content, link),
            target
          });
        }
      }
    });
    
    return references;
  }

  private findReferencingFiles(targetFile: string): string[] {
    const referencingFiles: string[] = [];
    const files = this.getFiles(process.cwd());
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const references = this.extractReferences(content);
      if (references.some(ref => {
        const absoluteTarget = path.resolve(path.dirname(file), ref.target.split('#')[0]);
        return absoluteTarget === targetFile;
      })) {
        referencingFiles.push(file);
      }
    });
    
    return referencingFiles;
  }

  private determineDocumentType(analysis: DocumentAnalysis): DocumentType {
    const { metadata, referencedBy } = analysis;
    const { tags, sections } = metadata;

    // Check tags first
    if (tags.includes('api')) {
      if (tags.includes('auth')) return 'api-auth';
      if (tags.includes('error')) return 'api-error';
      if (tags.includes('websocket')) return 'api-websocket';
      if (tags.includes('caching')) return 'api-caching';
      if (sections.some(s => s.toLowerCase().includes('endpoint'))) return 'api-endpoint';
    }

    // Check sections and content patterns
    if (tags.includes('guide')) return 'development-guide';
    if (sections.some(s => s.toLowerCase().includes('script'))) return 'development-script';
    if (sections.some(s => s.toLowerCase().includes('standard'))) return 'development-standard';
    if (sections.some(s => s.toLowerCase().includes('operation'))) return 'development-operation';

    // Check references
    const apiRefs = referencedBy.filter(f => f.includes('/api/')).length;
    const devRefs = referencedBy.filter(f => f.includes('/development/')).length;
    if (apiRefs > devRefs) return 'api-endpoint';
    if (devRefs > apiRefs) return 'development-guide';

    return 'unknown';
  }

  private getPathForDocumentType(docType: DocumentType): string {
    const base = this.documentStructure.path;
    switch (docType) {
      case 'api-endpoint': return path.join(base, 'api/endpoints');
      case 'api-auth': return path.join(base, 'api/authentication');
      case 'api-error': return path.join(base, 'api/error-handling');
      case 'api-websocket': return path.join(base, 'api/websocket');
      case 'api-caching': return path.join(base, 'api/caching');
      case 'development-guide': return path.join(base, 'development/guides');
      case 'development-script': return path.join(base, 'development/scripts');
      case 'development-standard': return path.join(base, 'development/standards');
      case 'development-operation': return path.join(base, 'development/operations');
      case 'core': return path.join(base, 'core');
      default: return base;
    }
  }

  public async checkReferences(rootDir: string = process.cwd()): Promise<ReferenceReport> {
    console.log(chalk.blue('Starting reference check...'));

    const files = this.getFiles(rootDir);
    this.report.totalFiles = files.length;

    // Check for duplicate filenames and structure violations
    const filenameMap = new Map<string, string[]>();
    files.forEach(file => {
      const name = path.basename(file);
      const existing = filenameMap.get(name) || [];
      existing.push(file);
      filenameMap.set(name, existing);

      // Check if file is in correct location
      const correctLocation = this.findCorrectLocation(name, file);
      if (correctLocation && correctLocation !== file) {
        this.report.structureViolations.push({
          file,
          correctLocation
        });
      }
    });

    // Process duplicates with correct locations
    for (const [name, paths] of filenameMap.entries()) {
      if (paths.length > 1) {
        const correctPath = this.findCorrectLocation(name, paths[0]);
        this.report.duplicateFilenames.push({ name, paths, correctPath });
      }
    }

    // Check references and file accuracy
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      this.checkFileAccuracy(file, content);
      this.findReferences(file, content);
    }

    this.printReport();
    return this.report;
  }

  private findCorrectLocation(filename: string, currentPath: string): string | undefined {
    const content = fs.readFileSync(currentPath, 'utf8');
    const analysis = this.analyzeDocument(currentPath, content);
    const documentType = this.determineDocumentType(analysis);
    const suggestedPath = this.getPathForDocumentType(documentType);
    
    return path.join(suggestedPath, filename);
  }

  private getFiles(rootDir: string): string[] {
    return glob.sync('**/*.md', {
      cwd: rootDir,
      absolute: true,
      ignore: this.excludeDirs.map(dir => `**/${dir}/**`)
    });
  }

  private checkFileAccuracy(filePath: string, content: string): void {
    const issues: string[] = [];

    // Check timestamp
    if (!content.includes('Last Updated:')) {
      issues.push('Missing last updated timestamp');
    }

    // Check main header
    if (!content.match(/^# [^\n]+/)) {
      issues.push('Missing or improper main header');
    }

    // Check content structure
    if (!content.includes('## Overview') && !content.includes('## Introduction')) {
      issues.push('Missing overview/introduction section');
    }

    // Check code block formatting
    const codeBlocks = content.match(/```[a-z]*\n[\s\S]*?```/g) || [];
    codeBlocks.forEach(block => {
      if (!block.match(/```[a-z]+\n/)) {
        issues.push('Code block missing language specification');
      }
    });

    if (issues.length > 0) {
      this.report.inaccurateFiles.push({ path: filePath, issues });
    }
  }

  private findReferences(filePath: string, content: string): void {
    const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    
    links.forEach(link => {
      this.report.totalReferences++;
      
      const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        const [, , target] = match;
        if (!target.startsWith('http')) {
          const absoluteTarget = path.resolve(path.dirname(filePath), target.split('#')[0]);
          if (!fs.existsSync(absoluteTarget)) {
            const lineNumber = this.findLineNumber(content, link);
            this.report.brokenReferences.push({
              source: filePath,
              line: lineNumber,
              target
            });
          }
        }
      }
    });
  }

  private findLineNumber(content: string, text: string): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(text)) {
        return i + 1;
      }
    }
    return 0;
  }

  private printReport(): void {
    console.log('\nReference Check Report');
    console.log('====================\n');
    console.log(`Total files checked: ${this.report.totalFiles}`);
    console.log(`Total references found: ${this.report.totalReferences}`);
    
    if (this.report.structureViolations.length > 0) {
      console.log(chalk.yellow(`\nStructure Violations Found: ${this.report.structureViolations.length}`));
      this.report.structureViolations.forEach(({ file, correctLocation }) => {
        console.log(`\nFile: ${file}`);
        console.log(`Should be in: ${correctLocation}`);
        console.log(`Suggested command: mkdir -p "${path.dirname(correctLocation)}" && mv "${file}" "${correctLocation}"`);
      });
    }
    
    if (this.report.duplicateFilenames.length > 0) {
      console.log(chalk.yellow(`\nDuplicate Filenames Found: ${this.report.duplicateFilenames.length}`));
      this.report.duplicateFilenames.forEach(({ name, paths, correctPath }) => {
        console.log(`\nFilename: ${name}`);
        paths.forEach(path => console.log(`  - ${path}`));
        if (correctPath) {
          console.log(chalk.green(`  Correct location: ${correctPath}`));
        }
      });
    }

    if (this.report.inaccurateFiles.length > 0) {
      console.log(chalk.yellow(`\nInaccurate Files Found: ${this.report.inaccurateFiles.length}`));
      this.report.inaccurateFiles.forEach(({ path, issues }) => {
        console.log(`\nFile: ${path}`);
        issues.forEach(issue => console.log(`  - ${issue}`));
      });
    }

    if (this.report.brokenReferences.length > 0) {
      console.log(chalk.red(`\nBroken references found: ${this.report.brokenReferences.length}`));
      console.log('\nBroken References:');
      this.report.brokenReferences.forEach(ref => {
        console.log(chalk.red(`✗ ${path.relative(process.cwd(), ref.source)}:${ref.line} - ${ref.target}`));
      });
    }
  }
}

// CLI interface
if (typeof require !== 'undefined' && require.main === module) {
  const checker = new ReferenceChecker();
    void checker.checkReferences();
} 
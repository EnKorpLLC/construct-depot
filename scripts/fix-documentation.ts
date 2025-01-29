import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { ReferenceChecker } from './check-references';

class DocumentationFixer {
  private referenceChecker: ReferenceChecker;

  constructor() {
    this.referenceChecker = new ReferenceChecker();
  }

  public async fixAll(): Promise<void> {
    console.log(chalk.blue('Starting documentation fixes...'));

    // Step 1: Fix structure violations
    console.log(chalk.yellow('\nStep 1: Fixing structure violations...'));
    await this.fixStructureViolations();

    // Step 2: Fix cross-references
    console.log(chalk.yellow('\nStep 2: Fixing cross-references...'));
    await this.fixCrossReferences();

    // Step 3: Fix formatting
    console.log(chalk.yellow('\nStep 3: Fixing formatting issues...'));
    await this.fixFormatting();

    console.log(chalk.green('\nAll fixes completed!'));
  }

  private async fixStructureViolations(): Promise<void> {
    const report = await this.referenceChecker.checkReferences();
    
    if (report.structureViolations.length === 0) {
      console.log(chalk.green('No structure violations found.'));
      return;
    }

    // First, create all necessary directories
    const allPaths = new Set<string>();
    report.structureViolations.forEach(({ correctLocation }) => {
      allPaths.add(path.dirname(correctLocation));
    });
    report.duplicateFilenames.forEach(({ correctPath }) => {
      if (correctPath) {
        allPaths.add(path.dirname(correctPath));
      }
    });

    allPaths.forEach(dir => {
      if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Handle structure violations
    for (const violation of report.structureViolations) {
      const { file, correctLocation } = violation;
      if (fs.existsSync(file)) {
        console.log(`Moving ${file} to ${correctLocation}`);
        try {
          fs.renameSync(file, correctLocation);
        } catch (error: any) {
          console.error(`Error moving ${file}: ${error?.message || 'Unknown error'}`);
          // Try copy and delete as fallback
          try {
            fs.copyFileSync(file, correctLocation);
            fs.unlinkSync(file);
            console.log(`Successfully copied and removed ${file}`);
          } catch (copyError: any) {
            console.error(`Failed to copy ${file}: ${copyError?.message || 'Unknown error'}`);
          }
        }
      } else {
        console.log(chalk.yellow(`Source file not found: ${file}`));
      }
    }

    // Handle duplicates
    for (const duplicate of report.duplicateFilenames) {
      if (duplicate.correctPath) {
        console.log(`\nHandling duplicate ${duplicate.name}:`);
        
        // Find the first existing file
        const existingFiles = duplicate.paths.filter(p => fs.existsSync(p));
        if (existingFiles.length === 0) {
          console.log(chalk.yellow(`No existing files found for ${duplicate.name}`));
          continue;
        }

        // Keep the file in the correct location or move the first one there
        const correctFile = existingFiles.find(p => p === duplicate.correctPath);
        if (correctFile) {
          // Remove other copies
          existingFiles
            .filter(p => p !== duplicate.correctPath)
            .forEach(file => {
              try {
                console.log(`Removing duplicate at ${file}`);
                fs.unlinkSync(file);
              } catch (error: any) {
                console.error(`Error removing ${file}: ${error?.message || 'Unknown error'}`);
              }
            });
        } else {
          // Move the first file to correct location and remove others
          const [firstFile, ...rest] = existingFiles;
          try {
            fs.copyFileSync(firstFile, duplicate.correctPath);
            console.log(`Copied ${firstFile} to ${duplicate.correctPath}`);
            
            // Remove all duplicates including the source
            existingFiles.forEach(file => {
              try {
                fs.unlinkSync(file);
                console.log(`Removed ${file}`);
              } catch (error: any) {
                console.error(`Error removing ${file}: ${error?.message || 'Unknown error'}`);
              }
            });
          } catch (error: any) {
            console.error(`Error handling ${firstFile}: ${error?.message || 'Unknown error'}`);
          }
        }
      }
    }
  }

  private async fixCrossReferences(): Promise<void> {
    const report = await this.referenceChecker.checkReferences();
    
    if (report.brokenReferences.length === 0) {
      console.log(chalk.green('No broken references found.'));
      return;
    }

    for (const ref of report.brokenReferences) {
      const content = fs.readFileSync(ref.source, 'utf8');
      const lines = content.split('\n');
      
      // Try to find the correct path
      const targetFile = path.basename(ref.target.split('#')[0]);
      const fragment = ref.target.includes('#') ? '#' + ref.target.split('#')[1] : '';
      
      // Search for the file in the correct structure
      const files = glob.sync('**/' + targetFile, {
        cwd: process.cwd(),
        absolute: true,
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
      });

      if (files.length > 0) {
        // Use the first found file as the correct reference
        const correctPath = path.relative(path.dirname(ref.source), files[0]) + fragment;
        
        // Replace the broken reference
        const line = lines[ref.line - 1];
        const fixedLine = line.replace(ref.target, correctPath);
        lines[ref.line - 1] = fixedLine;
        
        // Write back to file
        fs.writeFileSync(ref.source, lines.join('\n'));
        console.log(`Fixed reference in ${ref.source}:${ref.line}`);
      } else {
        console.log(chalk.yellow(`Could not find target file for reference: ${ref.target}`));
      }
    }
  }

  private async fixFormatting(): Promise<void> {
    const report = await this.referenceChecker.checkReferences();
    
    if (report.inaccurateFiles.length === 0) {
      console.log(chalk.green('No formatting issues found.'));
      return;
    }

    for (const file of report.inaccurateFiles) {
      console.log(`\nFixing formatting in ${file.path}`);
      let content = fs.readFileSync(file.path, 'utf8');
      let modified = false;

      // Fix header style
      if (file.issues.some((i: string) => i.includes('header style'))) {
        content = content.replace(/^([#]+)\s*([^\n]+)/gm, (_, hashes, text) => {
          return `${hashes} ${text.trim()}`;
        });
        modified = true;
      }

      // Fix line endings
      if (file.issues.some((i: string) => i.includes('line endings'))) {
        content = content.replace(/\r\n/g, '\n');
        modified = true;
      }

      // Fix code blocks
      if (file.issues.some((i: string) => i.includes('language specification'))) {
        content = content.replace(/```\n/g, '```typescript\n');
        modified = true;
      }

      // Add timestamp if missing
      if (file.issues.some((i: string) => i.includes('timestamp'))) {
        if (!content.includes('Last Updated:')) {
          const date = new Date().toISOString().split('T')[0];
          content = `Last Updated: ${date}\n\n${content}`;
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(file.path, content);
        console.log(chalk.green('Fixed formatting issues'));
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const fixer = new DocumentationFixer();
  fixer.fixAll().catch(console.error);
} 
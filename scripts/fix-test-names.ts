#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const rename = promisify(fs.rename);

interface TestFileIssue {
  file: string;
  correctName: string;
}

async function checkTestNames(dir: string): Promise<TestFileIssue[]> {
  const issues: TestFileIssue[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') {
        // Process test files in __tests__ directory
        const testFiles = await readdir(fullPath);
        for (const testFile of testFiles) {
          if (!testFile.endsWith('.test.tsx')) continue;

          // Check if the file name is already in PascalCase
          const componentName = testFile.replace('.test.tsx', '');
          const firstChar = componentName.charAt(0);
          
          if (firstChar !== firstChar.toUpperCase()) {
            // Convert to PascalCase
            const pascalCaseName = componentName
              .split(/[-_]/)
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join('');

            issues.push({
              file: path.join(fullPath, testFile),
              correctName: `${pascalCaseName}.test.tsx`
            });
          }
        }
      } else {
        // Recursively process other directories
        issues.push(...await checkTestNames(fullPath));
      }
    }
  }

  return issues;
}

async function fixTestNames(dir: string, checkOnly: boolean = false): Promise<number> {
  let issueCount = 0;
  const issues = await checkTestNames(dir);

  if (checkOnly) {
    for (const issue of issues) {
      console.error(`${issue.file}:`);
      console.error(`  - Should be renamed to: ${issue.correctName}`);
      issueCount++;
    }
  } else {
    for (const issue of issues) {
      try {
        await rename(issue.file, path.join(path.dirname(issue.file), issue.correctName));
        console.log(`✅ Renamed ${path.basename(issue.file)} to ${issue.correctName}`);
        issueCount++;
      } catch (error: any) {
        console.error(`❌ Failed to rename ${issue.file}: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  return issueCount;
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  console.log(checkOnly ? 'Checking test file names...' : 'Fixing test file names...');
  
  const componentsDir = path.join(process.cwd(), 'src/components');
  const issueCount = await fixTestNames(componentsDir, checkOnly);

  if (issueCount === 0) {
    console.log('✅ No issues found');
    process.exit(0);
  } else {
    if (checkOnly) {
      console.error(`❌ Found ${issueCount} test file naming issues`);
      process.exit(1);
    } else {
      console.log(`✅ Fixed ${issueCount} test files`);
      process.exit(0);
    }
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 
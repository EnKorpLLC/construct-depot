#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const rename = promisify(fs.rename);

async function fixTestNames(dir: string): Promise<number> {
  let renamedFiles = 0;
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
            // Convert to PascalCase if it's not already
            const pascalCaseName = componentName
              .split(/[-_]/)
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join('');

            const newName = `${pascalCaseName}.test.tsx`;
            const oldPath = path.join(fullPath, testFile);
            const newPath = path.join(fullPath, newName);
            
            try {
              await rename(oldPath, newPath);
              console.log(`✅ Renamed ${testFile} to ${newName}`);
              renamedFiles++;
            } catch (error: any) {
              console.error(`❌ Failed to rename ${testFile}: ${error?.message || 'Unknown error'}`);
            }
          }
        }
      } else {
        // Recursively process other directories
        renamedFiles += await fixTestNames(fullPath);
      }
    }
  }

  return renamedFiles;
}

async function main() {
  console.log('Fixing test file names...');
  
  const componentsDir = path.join(process.cwd(), 'src/components');
  const renamedFiles = await fixTestNames(componentsDir);

  if (renamedFiles === 0) {
    console.log('✅ No files needed renaming');
    process.exit(0);
  } else {
    console.log(`✅ Renamed ${renamedFiles} files`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 
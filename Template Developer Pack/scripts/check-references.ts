import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface Reference {
  sourceFile: string;
  targetFile: string;
  line: number;
  column: number;
  text: string;
}

interface DuplicateFile {
  name: string;
  paths: string[];
}

async function checkReferences(): Promise<void> {
  console.log('Starting reference check...');
  
  // Find all markdown files
  const files = glob.sync('**/*.md', {
    ignore: ['**/node_modules/**', '**/dist/**']
  });
  
  const references: Reference[] = [];
  const brokenReferences: Reference[] = [];
  const duplicateFiles: Map<string, string[]> = new Map();
  
  // Track duplicate filenames
  files.forEach(file => {
    const name = path.basename(file);
    const existing = duplicateFiles.get(name) || [];
    existing.push(file);
    duplicateFiles.set(name, existing);
  });
  
  // Check each file for references
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    // Find all markdown links
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      
      while ((match = linkRegex.exec(line)) !== null) {
        const [fullMatch, text, link] = match;
        
        // Skip external links and anchor links
        if (!link.startsWith('http') && !link.startsWith('#')) {
          const reference: Reference = {
            sourceFile: file,
            targetFile: link,
            line: i + 1,
            column: match.index,
            text
          };
          
          references.push(reference);
          
          // Check if reference exists
          const targetPath = path.resolve(path.dirname(file), link);
          if (!fs.existsSync(targetPath)) {
            brokenReferences.push(reference);
          }
        }
      }
    }
  }
  
  // Filter duplicate files to only those with multiple paths
  const duplicates: DuplicateFile[] = [];
  duplicateFiles.forEach((paths, name) => {
    if (paths.length > 1) {
      duplicates.push({ name, paths });
    }
  });
  
  // Print summary
  console.log('\nReference check complete:');
  console.log(`Total files checked: ${files.length}`);
  console.log(`Total references found: ${references.length}`);
  console.log(`Broken references: ${brokenReferences.length}`);
  console.log(`Duplicate filenames: ${duplicates.length}`);
  
  // Print duplicate files
  if (duplicates.length > 0) {
    console.log('\nDuplicate filenames found:');
    duplicates.forEach(({ name, paths }) => {
      console.log(`\n${name}:`);
      paths.forEach(path => console.log(`  - ${path}`));
    });
  }
  
  // Print broken references
  if (brokenReferences.length > 0) {
    console.log('\nBroken references found:');
    brokenReferences.forEach(ref => {
      console.log(`\nIn ${ref.sourceFile} (line ${ref.line}):`);
      console.log(`  Link text: ${ref.text}`);
      console.log(`  Target: ${ref.targetFile}`);
    });
  }
}

checkReferences().catch(console.error); 
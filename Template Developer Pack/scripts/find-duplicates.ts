import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface DuplicateCode {
  content: string;
  locations: {
    file: string;
    startLine: number;
    endLine: number;
  }[];
}

interface DuplicateFile {
  name: string;
  paths: string[];
}

async function findDuplicates(): Promise<void> {
  console.log('Starting duplicate detection...');
  
  // Find all relevant files
  const files = glob.sync('**/*.{ts,js,tsx,jsx,md}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.min.js']
  });
  
  console.log(`Found ${files.length} files to analyze...`);
  
  const duplicateFiles: Map<string, string[]> = new Map();
  const codeBlocks: Map<string, { file: string, startLine: number, endLine: number }[]> = new Map();
  
  // Track duplicate filenames
  files.forEach(file => {
    const name = path.basename(file);
    const existing = duplicateFiles.get(name) || [];
    existing.push(file);
    duplicateFiles.set(name, existing);
  });
  
  // Analyze code content
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    // Look for code blocks of at least 5 lines
    const MIN_BLOCK_SIZE = 5;
    
    for (let i = 0; i <= lines.length - MIN_BLOCK_SIZE; i++) {
      const block = lines.slice(i, i + MIN_BLOCK_SIZE).join('\n');
      
      // Skip empty or whitespace-only blocks
      if (!block.trim()) continue;
      
      const existing = codeBlocks.get(block) || [];
      existing.push({
        file,
        startLine: i + 1,
        endLine: i + MIN_BLOCK_SIZE
      });
      codeBlocks.set(block, existing);
    }
  }
  
  // Filter results
  const duplicates: DuplicateCode[] = [];
  codeBlocks.forEach((locations, content) => {
    if (locations.length > 1) {
      duplicates.push({ content, locations });
    }
  });
  
  const duplicateFilesList: DuplicateFile[] = [];
  duplicateFiles.forEach((paths, name) => {
    if (paths.length > 1) {
      duplicateFilesList.push({ name, paths });
    }
  });
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    duplicateFiles: duplicateFilesList,
    duplicateCode: duplicates
  };
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
  }
  
  // Save report
  const reportPath = path.join('reports', `duplicate-code-${report.timestamp.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\nDuplicate detection complete:');
  console.log(`Total files analyzed: ${files.length}`);
  console.log(`Duplicate filenames found: ${duplicateFilesList.length}`);
  console.log(`Duplicate code blocks found: ${duplicates.length}`);
  console.log(`Report saved to: ${reportPath}`);
  
  // Print duplicate files
  if (duplicateFilesList.length > 0) {
    console.log('\nDuplicate filenames:');
    duplicateFilesList.forEach(({ name, paths }) => {
      console.log(`\n${name}:`);
      paths.forEach(path => console.log(`  - ${path}`));
    });
  }
  
  // Print duplicate code
  if (duplicates.length > 0) {
    console.log('\nDuplicate code blocks:');
    duplicates.forEach(({ content, locations }) => {
      console.log('\nDuplicate block found in:');
      locations.forEach(loc => {
        console.log(`  ${loc.file} (lines ${loc.startLine}-${loc.endLine})`);
      });
      console.log('\nContent:');
      console.log(content);
    });
  }
}

findDuplicates().catch(console.error); 
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface DocFix {
  file: string;
  fixes: string[];
}

async function fixDocumentation(): Promise<void> {
  console.log('Starting documentation fixes...');
  
  // Find all markdown files
  const files = glob.sync('**/*.md', {
    ignore: ['**/node_modules/**', '**/dist/**']
  });
  
  const fixes: DocFix[] = [];
  let totalFilesFixed = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const fileChanges: string[] = [];
    let modified = false;
    
    // Check for title (H1 header)
    if (!lines[0]?.startsWith('# ')) {
      const fileName = path.basename(file, '.md');
      lines.unshift(`# ${fileName}`);
      fileChanges.push('Added missing title');
      modified = true;
    }
    
    // Check for timestamp
    if (!lines.some(line => line.toLowerCase().includes('last updated:'))) {
      const today = new Date().toISOString().split('T')[0];
      lines.splice(1, 0, `Last Updated: ${today}`);
      fileChanges.push('Added timestamp');
      modified = true;
    }
    
    // Check for overview section
    if (!lines.some(line => line.toLowerCase().startsWith('## overview'))) {
      const insertIndex = lines.findIndex(line => line.startsWith('##')) || 2;
      lines.splice(insertIndex, 0, '\n## Overview\n\n[Add overview here]\n');
      fileChanges.push('Added overview section');
      modified = true;
    }
    
    // Fix code blocks without language specification
    let inCodeBlock = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('```') && !inCodeBlock) {
        if (lines[i] === '```') {
          lines[i] = '```text';
          fileChanges.push('Added language specification to code block');
          modified = true;
        }
        inCodeBlock = true;
      } else if (lines[i].startsWith('```')) {
        inCodeBlock = false;
      }
    }
    
    // Fix relative paths in links
    const linkRegex = /\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g;
    for (let i = 0; i < lines.length; i++) {
      const newLine = lines[i].replace(linkRegex, (match, text, link) => {
        if (!link.startsWith('./') && !link.startsWith('../') && !link.startsWith('#')) {
          return `[${text}](./${link})`;
        }
        return match;
      });
      if (newLine !== lines[i]) {
        lines[i] = newLine;
        fileChanges.push('Fixed relative path in link');
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, lines.join('\n'));
      fixes.push({ file, fixes: fileChanges });
      totalFilesFixed++;
    }
  }
  
  // Print summary
  console.log(`\nDocumentation fixes complete:`);
  console.log(`Total files processed: ${files.length}`);
  console.log(`Files updated: ${totalFilesFixed}`);
  
  if (fixes.length > 0) {
    console.log('\nFixed files:');
    fixes.forEach(({ file, fixes }) => {
      console.log(`\n${file}:`);
      fixes.forEach(fix => console.log(`  - ${fix}`));
    });
  }
}

fixDocumentation().catch(console.error); 
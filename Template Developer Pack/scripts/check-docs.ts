import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface DocIssue {
  file: string;
  issues: string[];
}

async function checkDocumentation(): Promise<void> {
  console.log('Starting documentation check...');
  
  // Find all markdown files
  const files = glob.sync('**/*.md', {
    ignore: ['**/node_modules/**', '**/dist/**']
  });
  
  const issues: DocIssue[] = [];
  let totalIssues = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const fileIssues: string[] = [];
    
    // Check for title (H1 header)
    if (!lines[0]?.startsWith('# ')) {
      fileIssues.push('Missing title (H1 header)');
    }
    
    // Check for timestamp
    if (!lines.some(line => line.toLowerCase().includes('last updated:'))) {
      fileIssues.push('Missing timestamp');
    }
    
    // Check for overview section
    if (!lines.some(line => line.toLowerCase().startsWith('## overview'))) {
      fileIssues.push('Missing overview section');
    }
    
    // Check header hierarchy
    let currentLevel = 1;
    let lastHeaderLevel = 1;
    for (const line of lines) {
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)[0].length;
        if (level - lastHeaderLevel > 1) {
          fileIssues.push(`Invalid header hierarchy: ${line.trim()}`);
        }
        lastHeaderLevel = level;
      }
    }
    
    // Check code blocks
    let inCodeBlock = false;
    let codeBlockStart = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('```')) {
        if (!inCodeBlock) {
          codeBlockStart = i;
          if (lines[i] === '```') {
            fileIssues.push(`Missing language specification in code block at line ${i + 1}`);
          }
          inCodeBlock = true;
        } else {
          inCodeBlock = false;
        }
      }
    }
    if (inCodeBlock) {
      fileIssues.push(`Unclosed code block starting at line ${codeBlockStart + 1}`);
    }
    
    // Check links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const [, text, link] = match;
      if (!link.startsWith('http') && !link.startsWith('#')) {
        const targetPath = path.resolve(path.dirname(file), link);
        if (!fs.existsSync(targetPath)) {
          fileIssues.push(`Broken link: ${link}`);
        }
      }
    }
    
    // Check for long paragraphs (readability)
    const paragraphs = content.split('\n\n');
    for (let i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].length > 500) {
        fileIssues.push(`Long paragraph detected at position ${i + 1} (over 500 characters)`);
      }
    }
    
    if (fileIssues.length > 0) {
      issues.push({ file, issues: fileIssues });
      totalIssues += fileIssues.length;
    }
  }
  
  // Print summary
  console.log('\nDocumentation check complete:');
  console.log(`Total files checked: ${files.length}`);
  console.log(`Files with issues: ${issues.length}`);
  console.log(`Total issues found: ${totalIssues}`);
  
  if (issues.length > 0) {
    console.log('\nIssues found:');
    issues.forEach(({ file, issues }) => {
      console.log(`\n${file}:`);
      issues.forEach(issue => console.log(`  - ${issue}`));
    });
  }
}

checkDocumentation().catch(console.error); 
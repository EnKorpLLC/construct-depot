import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface DocFix {
  file: string;
  fixes: string[];
}

async function fixDocumentation() {
  console.log('Starting documentation fixes...');
  
  const files = await new Promise<string[]>((resolve, reject) => {
    glob('**/*.md', { ignore: ['**/node_modules/**', '**/dist/**'] }, (err, matches) => {
      if (err) reject(err);
      else resolve(matches);
    });
  });

  const fixes: DocFix[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let updatedContent = content;
      const fileIssues: string[] = [];

      // Add main header if missing
      if (!content.startsWith('# ')) {
        const title = path.basename(file, '.md')
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        updatedContent = `# ${title}\n\n${content}`;
        fileIssues.push('Added missing header');
      }

      // Add overview if missing
      if (!content.toLowerCase().includes('## overview') && 
          !content.toLowerCase().includes('## introduction')) {
        const overview = `\n## Overview\n\nThis document provides information about ${path.basename(file, '.md')}.\n\n`;
        const firstSection = updatedContent.indexOf('\n## ');
        if (firstSection !== -1) {
          updatedContent = updatedContent.slice(0, firstSection) + overview + updatedContent.slice(firstSection);
        } else {
          updatedContent += overview;
        }
        fileIssues.push('Added missing overview');
      }

      // Fix code blocks
      const codeBlockCount = (updatedContent.match(/```(\n|\r\n)/g) || []).length;
      if (codeBlockCount > 0) {
        updatedContent = updatedContent.replace(/```(\n|\r\n)/g, '```typescript\n');
        fileIssues.push(`Added language specification to ${codeBlockCount} code blocks`);
      }

      if (updatedContent !== content) {
        fs.writeFileSync(file, updatedContent);
        fixes.push({ file, fixes: fileIssues });
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }

  console.log('\nDocumentation fixes complete!');
  console.log(`Total files processed: ${files.length}`);
  console.log(`Files updated: ${fixes.length}`);
  
  if (fixes.length > 0) {
    console.log('\nFixed files:');
    fixes.forEach(({ file, fixes }) => {
      console.log(`\n${file}:`);
      fixes.forEach(fix => console.log(`  - ${fix}`));
    });
  }
}

fixDocumentation().catch(console.error); 
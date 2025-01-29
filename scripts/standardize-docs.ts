import * as fs from 'fs';
import * as path from 'path';

const standardizeDoc = (filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let updated = content;

  // Add title if missing
  if (!content.startsWith('# ')) {
    const title = path.basename(filePath, '.md')
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    updated = `# ${title}\n\n${content}`;
  }

  // Add overview if missing
  if (!content.toLowerCase().includes('## overview')) {
    const overview = `\n## Overview\n\nThis document provides information about ${path.basename(filePath, '.md')}.\n\n`;
    updated = updated.replace('\n## ', `${overview}## `);
  }

  // Add code block languages
  updated = updated.replace(/```(\n|\r\n)/g, '```typescript\n');

  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
    console.log(`Updated: ${filePath}`);
  }
};

// Run on a single file
if (process.argv[2]) {
  standardizeDoc(process.argv[2]);
} 
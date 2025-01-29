import * as fs from 'fs';
import * as glob from 'glob';

async function updateTimestamps(): Promise<void> {
  console.log('Starting timestamp updates...');
  
  // Find all markdown files
  const files = glob.sync('**/*.md', {
    ignore: ['**/node_modules/**', '**/dist/**']
  });
  
  const today = new Date().toISOString().split('T')[0];
  let filesUpdated = 0;
  const updatedFiles: string[] = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    
    // Look for Last Updated line
    const timestampIndex = lines.findIndex(line => 
      line.toLowerCase().includes('last updated:')
    );
    
    if (timestampIndex !== -1) {
      // Update existing timestamp
      lines[timestampIndex] = `Last Updated: ${today}`;
      modified = true;
    } else {
      // Add timestamp after title
      const titleIndex = lines.findIndex(line => line.startsWith('# '));
      if (titleIndex !== -1) {
        lines.splice(titleIndex + 1, 0, `Last Updated: ${today}`);
        modified = true;
      } else {
        // Add at the beginning if no title found
        lines.unshift(`Last Updated: ${today}`);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, lines.join('\n'));
      filesUpdated++;
      updatedFiles.push(file);
    }
  }
  
  // Print summary
  console.log('\nTimestamp updates complete:');
  console.log(`Total files processed: ${files.length}`);
  console.log(`Files updated: ${filesUpdated}`);
  
  if (updatedFiles.length > 0) {
    console.log('\nUpdated files:');
    updatedFiles.forEach(file => console.log(`  - ${file}`));
  }
}

updateTimestamps().catch(console.error); 
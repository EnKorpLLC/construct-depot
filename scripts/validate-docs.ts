import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';

interface DocFile {
  path: string;
  lastUpdated: Date;
  content: string;
}

// Configuration
const CONFIG = {
  docsDir: './guides',
  maxTimestampDiff: 24 * 60 * 60 * 1000, // 24 hours
  requiredSections: ['Overview', 'Configuration', 'Usage'],
  timestampFormat: /Last Updated: (\d{4}-\d{2}-\d{2} \d{2}:\d{2})/,
};

// Find all documentation files
function findDocFiles(dir: string): DocFile[] {
  const files: DocFile[] = [];
  
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findDocFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      const content = readFileSync(fullPath, 'utf-8');
      const match = content.match(CONFIG.timestampFormat);
      const lastUpdated = match ? new Date(match[1]) : new Date(0);
      
      files.push({
        path: relative(process.cwd(), fullPath),
        lastUpdated,
        content
      });
    }
  }
  
  return files;
}

// Get recently modified files from git
function getRecentChanges(): string[] {
  const output = execSync('git diff --name-only HEAD~1').toString();
  return output.split('\n').filter(Boolean);
}

// Validate documentation
function validateDocs() {
  console.log('Validating documentation...');
  
  const docFiles = findDocFiles(CONFIG.docsDir);
  const recentChanges = getRecentChanges();
  const errors: string[] = [];
  
  // Check for outdated timestamps
  const now = new Date();
  docFiles.forEach(doc => {
    const timeDiff = now.getTime() - doc.lastUpdated.getTime();
    if (timeDiff > CONFIG.maxTimestampDiff) {
      errors.push(`${doc.path}: Timestamp is more than 24 hours old`);
    }
  });
  
  // Check for missing documentation updates
  recentChanges.forEach(file => {
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const relatedDocs = docFiles.filter(doc => 
        doc.content.includes(file) || 
        doc.content.includes(file.replace(/\.[^/.]+$/, ""))
      );
      
      if (relatedDocs.length > 0) {
        const updatedDocs = relatedDocs.filter(doc => 
          now.getTime() - doc.lastUpdated.getTime() < CONFIG.maxTimestampDiff
        );
        
        if (updatedDocs.length === 0) {
          errors.push(`${file}: Related documentation not updated: ${
            relatedDocs.map(d => d.path).join(', ')
          }`);
        }
      }
    }
  });
  
  // Check for required sections
  docFiles.forEach(doc => {
    CONFIG.requiredSections.forEach(section => {
      if (!doc.content.includes(`## ${section}`)) {
        errors.push(`${doc.path}: Missing required section "${section}"`);
      }
    });
  });
  
  // Report results
  if (errors.length > 0) {
    console.error('Documentation validation failed:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  } else {
    console.log('Documentation validation passed!');
  }
}

// Run validation
validateDocs(); 
#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

interface ComponentIssue {
  file: string;
  issues: string[];
}

// Next.js special files that don't need to follow PascalCase
const NEXTJS_SPECIAL_FILES = ['page.tsx', 'layout.tsx', 'loading.tsx', 'error.tsx', 'not-found.tsx'];

async function scanDirectory(dir: string): Promise<ComponentIssue[]> {
  const issues: ComponentIssue[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      issues.push(...await scanDirectory(fullPath));
      continue;
    }

    if (!entry.name.endsWith('.tsx')) continue;

    const fileIssues: string[] = [];
    
    // Skip Next.js special files for PascalCase check
    const isNextJsSpecialFile = NEXTJS_SPECIAL_FILES.includes(entry.name);
    const isTestFile = entry.name.endsWith('.test.tsx');
    
    // Check file naming for regular component files
    if (!isNextJsSpecialFile && !isTestFile && entry.name !== 'index.tsx' && !/^[A-Z][A-Za-z0-9]*\.tsx$/.test(entry.name)) {
      fileIssues.push('Component file name should be in PascalCase');
    }

    // Read file content
    const content = await readFile(fullPath, 'utf-8');

    // Check for hooks without 'use client'
    if (
      (content.includes('useState') || content.includes('useEffect')) &&
      !content.includes("'use client'") &&
      !content.includes('"use client"')
    ) {
      fileIssues.push('Component uses React hooks but missing "use client" directive');
    }

    // Check import paths
    const importLines = content.match(/^import .* from ['"].*['"];?$/gm) || [];
    for (const line of importLines) {
      if (line.includes('@/components/')) {
        const importPath = line.match(/@\/components\/[^'"]+/)?.[0];
        if (importPath) {
          const parts = importPath.split('/');
          const lastPart = parts[parts.length - 1];
          if (lastPart && !/^[A-Z][A-Za-z0-9]*$/.test(lastPart)) {
            fileIssues.push(`Component import "${lastPart}" should use PascalCase`);
          }
        }
      }
    }

    // Check export naming for regular components
    if (!isNextJsSpecialFile && !isTestFile && content.includes('export default')) {
      const hasDefaultExport = content.match(/export default function ([A-Z][A-Za-z0-9]*)/);
      const hasDefaultComponent = content.match(/export default const ([A-Z][A-Za-z0-9]*)/);
      if (!hasDefaultExport && !hasDefaultComponent) {
        fileIssues.push('Default export should use PascalCase naming');
      }
    }

    if (fileIssues.length > 0) {
      issues.push({ file: fullPath, issues: fileIssues });
    }
  }

  return issues;
}

async function main() {
  console.log('Checking component structure...');
  
  const componentsDir = path.join(process.cwd(), 'src/components');
  const pagesDir = path.join(process.cwd(), 'src/app');

  const allIssues: ComponentIssue[] = [
    ...(await scanDirectory(componentsDir)),
    ...(await scanDirectory(pagesDir))
  ];

  if (allIssues.length === 0) {
    console.log('✅ All components follow the naming conventions');
    process.exit(0);
  }

  console.error('❌ Found component structure issues:');
  for (const { file, issues } of allIssues) {
    console.error(`\n${file}:`);
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
  }
  
  process.exit(1);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 
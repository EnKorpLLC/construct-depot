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
    
    // Check file naming
    if (entry.name !== 'index.tsx' && !/^[A-Z][A-Za-z0-9]*\.tsx$/.test(entry.name)) {
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
      if (line.includes('@/components/') && !/[A-Z][A-Za-z0-9]*'/.test(line)) {
        fileIssues.push('Component import should use PascalCase');
      }
    }

    // Check export naming
    if (
      content.includes('export default') &&
      !content.match(/export default function [A-Z][A-Za-z0-9]*/)
    ) {
      fileIssues.push('Default export should use PascalCase naming');
    }

    if (fileIssues.length > 0) {
      issues.push({ file: fullPath, issues: fileIssues });
    }
  }

  return issues;
}

async function main() {
  const componentsDir = path.join(process.cwd(), 'src/components');
  const pagesDir = path.join(process.cwd(), 'src/app');

  console.log('Checking component structure...');
  
  const issues = [
    ...(await scanDirectory(componentsDir)),
    ...(await scanDirectory(pagesDir))
  ];

  if (issues.length === 0) {
    console.log('✅ All components follow the naming conventions');
    process.exit(0);
  }

  console.error('❌ Found component structure issues:');
  for (const { file, issues } of issues) {
    console.error(`\n${file}:`);
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
  }
  
  process.exit(1);
}

main().catch(console.error); 
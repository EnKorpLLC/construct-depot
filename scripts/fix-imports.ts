#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

const UI_COMPONENTS = [
  'Accordion',
  'Alert',
  'AlertDialog',
  'AspectRatio',
  'Avatar',
  'Badge',
  'Button',
  'Calendar',
  'Card',
  'Checkbox',
  'Collapsible',
  'Command',
  'ContextMenu',
  'Dialog',
  'DropdownMenu',
  'Form',
  'HoverCard',
  'Input',
  'Label',
  'Menubar',
  'Navigation',
  'Popover',
  'Progress',
  'RadioGroup',
  'ScrollArea',
  'Select',
  'Separator',
  'Sheet',
  'Skeleton',
  'Slider',
  'Switch',
  'Table',
  'Tabs',
  'Textarea',
  'Toast',
  'Toggle',
  'Tooltip',
];

async function checkImports(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, 'utf-8');
  const issues: string[] = [];

  // Check UI component imports
  for (const component of UI_COMPONENTS) {
    const lowerComponent = component.toLowerCase();
    const regex = new RegExp(`@/components/ui/${lowerComponent}['"]`, 'g');
    if (regex.test(content)) {
      issues.push(`Import uses lowercase '${lowerComponent}' instead of '${component}'`);
    }
  }

  return issues;
}

async function fixImports(filePath: string, checkOnly: boolean = false): Promise<boolean> {
  const content = await readFile(filePath, 'utf-8');
  let newContent = content;
  let hasChanges = false;

  // Fix UI component imports
  for (const component of UI_COMPONENTS) {
    const lowerComponent = component.toLowerCase();
    const regex = new RegExp(`@/components/ui/${lowerComponent}['"]`, 'g');
    if (regex.test(newContent)) {
      if (checkOnly) {
        return true; // Found an issue
      }
      newContent = newContent.replace(regex, `@/components/ui/${component}'`);
      hasChanges = true;
    }
  }

  if (hasChanges && !checkOnly) {
    await writeFile(filePath, newContent);
    console.log(`✅ Fixed imports in ${filePath}`);
  }

  return hasChanges;
}

async function scanDirectory(dir: string, checkOnly: boolean = false): Promise<number> {
  let issueCount = 0;
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      issueCount += await scanDirectory(fullPath, checkOnly);
      continue;
    }

    if (!entry.name.endsWith('.tsx')) continue;

    if (checkOnly) {
      const issues = await checkImports(fullPath);
      if (issues.length > 0) {
        console.error(`\n${fullPath}:`);
        for (const issue of issues) {
          console.error(`  - ${issue}`);
        }
        issueCount += issues.length;
      }
    } else if (await fixImports(fullPath)) {
      issueCount++;
    }
  }

  return issueCount;
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  console.log(checkOnly ? 'Checking component imports...' : 'Fixing component imports...');
  
  const componentsDir = path.join(process.cwd(), 'src/components');
  const pagesDir = path.join(process.cwd(), 'src/app');

  const issueCount = await scanDirectory(componentsDir, checkOnly) + 
                    await scanDirectory(pagesDir, checkOnly);

  if (issueCount === 0) {
    console.log('✅ No issues found');
    process.exit(0);
  } else {
    if (checkOnly) {
      console.error(`❌ Found ${issueCount} import issues`);
      process.exit(1);
    } else {
      console.log(`✅ Fixed ${issueCount} files`);
      process.exit(0);
    }
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 
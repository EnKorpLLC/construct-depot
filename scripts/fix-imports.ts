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

async function fixImports(filePath: string): Promise<boolean> {
  const content = await readFile(filePath, 'utf-8');
  let newContent = content;
  let hasChanges = false;

  // Fix UI component imports
  for (const component of UI_COMPONENTS) {
    const lowerComponent = component.toLowerCase();
    const regex = new RegExp(`@/components/ui/${lowerComponent}['"]`, 'g');
    if (regex.test(newContent)) {
      newContent = newContent.replace(regex, `@/components/ui/${component}'`);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    await writeFile(filePath, newContent);
    console.log(`✅ Fixed imports in ${filePath}`);
  }

  return hasChanges;
}

async function scanDirectory(dir: string): Promise<number> {
  let fixedFiles = 0;
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      fixedFiles += await scanDirectory(fullPath);
      continue;
    }

    if (!entry.name.endsWith('.tsx')) continue;

    if (await fixImports(fullPath)) {
      fixedFiles++;
    }
  }

  return fixedFiles;
}

async function main() {
  console.log('Fixing component imports...');
  
  const componentsDir = path.join(process.cwd(), 'src/components');
  const pagesDir = path.join(process.cwd(), 'src/app');

  const fixedFiles = await scanDirectory(componentsDir) + await scanDirectory(pagesDir);

  if (fixedFiles === 0) {
    console.log('✅ No files needed fixing');
    process.exit(0);
  } else {
    console.log(`✅ Fixed imports in ${fixedFiles} files`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 
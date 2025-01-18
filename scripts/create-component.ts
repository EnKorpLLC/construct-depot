#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { execSync } from 'child_process';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

interface ComponentConfig {
  name: string;
  isClient: boolean;
  directory: string;
  withTest: boolean;
  withStory: boolean;
}

const TEMPLATE_CLIENT = `'use client';

import { type FC } from 'react';

interface {{NAME}}Props {
  // Define props here
}

export const {{NAME}}: FC<{{NAME}}Props> = (props) => {
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
};`;

const TEMPLATE_SERVER = `import { type FC } from 'react';

interface {{NAME}}Props {
  // Define props here
}

export const {{NAME}}: FC<{{NAME}}Props> = (props) => {
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
};`;

const TEST_TEMPLATE = `import { render, screen } from '@testing-library/react';
import { {{NAME}} } from './{{NAME}}';

describe('{{NAME}}', () => {
  it('renders correctly', () => {
    render(<{{NAME}} />);
    // Add your test cases here
  });
});`;

const STORY_TEMPLATE = `import type { Meta, StoryObj } from '@storybook/react';
import { {{NAME}} } from './{{NAME}}';

const meta: Meta<typeof {{NAME}}> = {
  title: 'Components/{{NAME}}',
  component: {{NAME}},
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof {{NAME}}>;

export const Default: Story = {
  args: {
    // Add default props here
  },
};`;

async function createComponent(config: ComponentConfig) {
  const { name, isClient, directory, withTest, withStory } = config;
  
  // Validate component name
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    throw new Error('Component name must be in PascalCase');
  }

  // Create component directory
  const componentDir = path.join('src/components', directory, name);
  await mkdir(componentDir, { recursive: true });

  // Create component file
  const template = isClient ? TEMPLATE_CLIENT : TEMPLATE_SERVER;
  const componentContent = template.replace(/{{NAME}}/g, name);
  await writeFile(
    path.join(componentDir, `${name}.tsx`),
    componentContent
  );

  // Create test file if requested
  if (withTest) {
    const testContent = TEST_TEMPLATE.replace(/{{NAME}}/g, name);
    await writeFile(
      path.join(componentDir, `${name}.test.tsx`),
      testContent
    );
  }

  // Create story file if requested
  if (withStory) {
    const storyContent = STORY_TEMPLATE.replace(/{{NAME}}/g, name);
    await writeFile(
      path.join(componentDir, `${name}.stories.tsx`),
      storyContent
    );
  }

  // Format files
  execSync(`npx prettier --write "${componentDir}/**/*.{ts,tsx}"`);

  console.log(`✅ Created component ${name} in ${componentDir}`);
  console.log('Files created:');
  console.log(`- ${name}.tsx`);
  if (withTest) console.log(`- ${name}.test.tsx`);
  if (withStory) console.log(`- ${name}.stories.tsx`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const name = args[0];
const directory = args[1] || '';
const flags = new Set(args.slice(2));

if (!name) {
  console.error('Please provide a component name');
  process.exit(1);
}

createComponent({
  name,
  directory,
  isClient: flags.has('--client'),
  withTest: flags.has('--test') || flags.has('--with-test'),
  withStory: flags.has('--story') || flags.has('--with-story'),
}).catch(console.error); 
import { beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

// Test utilities
export const createTestDir = () => {
  const testDir = path.join(__dirname, 'test-workspace');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  return testDir;
};

export const cleanTestDir = (dir: string) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

// Test hooks
beforeEach(function() {
  this.sandbox = sinon.createSandbox();
  this.testDir = createTestDir();
});

afterEach(function() {
  this.sandbox.restore();
  cleanTestDir(this.testDir);
});

// Test helpers
export const createTestFile = (dir: string, filename: string, content: string) => {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
};

export const readTestFile = (filePath: string) => {
  return fs.readFileSync(filePath, 'utf8');
};

// Mock data generators
export const createMockMarkdownFile = (customContent = '') => {
  return `# Test Document
Last Updated: ${new Date().toISOString().split('T')[0]}

## Overview

${customContent || 'This is a test document.'}

## Section 1

Content for section 1.

## Section 2

Content for section 2.
`;
};

export const createMockPackageJson = (name = 'test-project') => {
  return {
    name,
    version: '1.0.0',
    description: 'Test project configuration',
    scripts: {
      test: 'mocha -r ts-node/register "tests/**/*.test.ts"'
    },
    dependencies: {},
    devDependencies: {}
  };
};

// Assertion helpers
export const expectFileToExist = (filePath: string) => {
  expect(fs.existsSync(filePath)).to.be.true;
};

export const expectFileContent = (filePath: string, expectedContent: string) => {
  const content = fs.readFileSync(filePath, 'utf8');
  expect(content).to.equal(expectedContent);
};

export const expectJsonFileContent = (filePath: string, expectedObj: object) => {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  expect(content).to.deep.equal(expectedObj);
};

// Type definitions for test context
declare global {
  namespace Mocha {
    interface Context {
      sandbox: sinon.SinonSandbox;
      testDir: string;
    }
  }
} 
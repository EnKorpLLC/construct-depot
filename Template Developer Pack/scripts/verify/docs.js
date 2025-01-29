#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const markdownlint = require('markdownlint');
const glob = require('glob');

// Configuration
const config = {
  minReadmeLength: 500, // characters
  requiredSections: [
    'Overview',
    'Getting Started',
    'Installation',
    'Usage',
    'Configuration',
    'Contributing'
  ],
  docFiles: [
    'README.md',
    'docs/**/*.md',
    'guides/**/*.md'
  ],
  excludePaths: [
    'node_modules/**',
    'build/**',
    'dist/**'
  ]
};

// Markdown lint configuration
const markdownlintConfig = {
  "default": true,
  "MD013": false, // Line length
  "MD033": false, // Inline HTML
  "MD041": false, // First line in file should be a top level heading
};

// Utility functions
const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
};

const findFiles = (patterns, exclude) => {
  const files = [];
  patterns.forEach(pattern => {
    const matches = glob.sync(pattern, { ignore: exclude });
    files.push(...matches);
  });
  return [...new Set(files)]; // Remove duplicates
};

// Verification functions
const verifyReadmeContent = (content) => {
  if (!content) return false;
  
  // Check minimum length
  if (content.length < config.minReadmeLength) {
    console.error('❌ README.md is too short');
    return false;
  }

  // Check required sections
  const missingSections = config.requiredSections.filter(section => 
    !content.includes(`# ${section}`) && !content.includes(`## ${section}`)
  );

  if (missingSections.length > 0) {
    console.error('❌ Missing required sections:', missingSections.join(', '));
    return false;
  }

  return true;
};

const verifyMarkdownLinting = async (files) => {
  const options = {
    files: files,
    config: markdownlintConfig
  };

  try {
    const result = await new Promise((resolve, reject) => {
      markdownlint(options, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const resultString = result.toString();
    if (resultString) {
      console.error('❌ Markdown linting issues found:');
      console.error(resultString);
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Error during markdown linting:', error.message);
    return false;
  }
};

const verifyApiDocs = () => {
  const apiDocsPath = 'docs/api';
  if (!fs.existsSync(apiDocsPath)) {
    console.error('❌ API documentation directory missing');
    return false;
  }

  const requiredApiDocs = [
    'README.md',
    'authentication.md',
    'endpoints.md',
    'errors.md'
  ];

  const missingApiDocs = requiredApiDocs.filter(doc => 
    !fs.existsSync(path.join(apiDocsPath, doc))
  );

  if (missingApiDocs.length > 0) {
    console.error('❌ Missing API documentation files:', missingApiDocs.join(', '));
    return false;
  }

  return true;
};

const verifyCodeExamples = (content) => {
  // Check for code blocks
  const codeBlockMatches = content.match(/```[\s\S]*?```/g);
  if (!codeBlockMatches || codeBlockMatches.length === 0) {
    console.error('❌ No code examples found in documentation');
    return false;
  }

  // Check for language specification in code blocks
  const invalidCodeBlocks = codeBlockMatches.filter(block => 
    !block.match(/```[a-zA-Z]+\n/)
  );

  if (invalidCodeBlocks.length > 0) {
    console.error('❌ Code blocks found without language specification');
    return false;
  }

  return true;
};

// Main verification function
const verifyDocs = async () => {
  console.log('📝 Starting documentation verification...');
  
  // Find all documentation files
  const docFiles = findFiles(config.docFiles, config.excludePaths);
  if (docFiles.length === 0) {
    console.error('❌ No documentation files found');
    return false;
  }

  // Verify README
  const readmeContent = readFile('README.md');
  if (!verifyReadmeContent(readmeContent)) {
    return false;
  }

  // Verify markdown linting
  if (!await verifyMarkdownLinting(docFiles)) {
    return false;
  }

  // Verify API documentation
  if (!verifyApiDocs()) {
    return false;
  }

  // Verify code examples in documentation
  const allDocsContent = docFiles
    .map(file => readFile(file))
    .filter(Boolean)
    .join('\n');

  if (!verifyCodeExamples(allDocsContent)) {
    return false;
  }

  console.log('✅ Documentation verification passed');
  return true;
};

// Run verification if called directly
if (require.main === module) {
  verifyDocs().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Documentation verification failed:', error);
    process.exit(1);
  });
}

module.exports = verifyDocs; 
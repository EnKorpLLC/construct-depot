# Development Tools Guide
Last Updated: 2024-01-19 12:45

## Component Verification Tools

### 1. Component Structure Verification
- **Script**: `scripts/verify-component-names.ts`
- **Usage**: `npx ts-node scripts/verify-component-names.ts`
- **CI Mode**: Runs automatically in GitHub Actions
- **Checks**:
  - Component file names in PascalCase
  - Proper 'use client' directive usage
  - Export naming conventions
  - Special file handling (Next.js pages)

### 2. Import Path Checker
- **Script**: `scripts/fix-imports.ts`
- **Usage**: 
  - Check: `npx ts-node scripts/fix-imports.ts --check`
  - Fix: `npx ts-node scripts/fix-imports.ts`
- **CI Mode**: Runs in check mode via GitHub Actions
- **Features**:
  - Validates UI component import paths
  - Ensures correct casing in imports
  - Provides detailed error reporting
  - Automatic fixing capability

### 3. Test File Naming Tool
- **Script**: `scripts/fix-test-names.ts`
- **Usage**:
  - Check: `npx ts-node scripts/fix-test-names.ts --check`
  - Fix: `npx ts-node scripts/fix-test-names.ts`
- **CI Mode**: Runs in check mode via GitHub Actions
- **Features**:
  - Validates test file naming conventions
  - Ensures PascalCase for component tests
  - Handles special test directories
  - Automatic renaming capability

## CI Integration

### GitHub Actions Workflow
- **File**: `.github/workflows/component-checks.yml`
- **Triggers**:
  - Push to main branch
  - Pull requests to main branch
  - Changes in src/ directory
- **Checks**:
  1. ESLint validation
  2. TypeScript type checking
  3. Component structure verification
  4. Import path validation
  5. Test file naming convention

### Automated Checks
- Runs on ubuntu-latest
- Uses Node.js 18
- Caches npm dependencies
- Reports detailed status
- Fails if any check fails

## ESLint Configuration

### Component Rules
- Enforces 'use client' directive
- Validates import paths
- Ensures proper component naming
- Checks React hooks usage
- Validates prop types

### Type Safety
- Strict TypeScript checks
- No implicit any
- Explicit return types
- Proper interface usage

## Development Scripts

### Available Commands
```bash
# Component Verification
npm run verify-components    # Run all component checks
npm run fix-imports         # Fix import path issues
npm run fix-test-names      # Fix test file names

# Type Checking
npm run type-check          # Run TypeScript checks

# Linting
npm run lint               # Run ESLint
npm run lint:fix          # Fix ESLint issues
```

## Best Practices

### Component Development
1. Use the component checklist
2. Run verification tools locally
3. Fix issues before committing
4. Follow naming conventions
5. Use proper imports

### Code Quality
1. Write comprehensive tests
2. Maintain type safety
3. Document changes
4. Follow ESLint rules
5. Use proper error handling

## Troubleshooting

### Common Issues
1. Component verification failures
   - Check file naming
   - Verify import paths
   - Ensure proper exports
   
2. CI pipeline failures
   - Review GitHub Actions logs
   - Run checks locally first
   - Fix reported issues
   
3. Import path issues
   - Use correct casing
   - Follow path conventions
   - Run fix-imports script

### Support
- Check GitHub Actions logs
- Review error messages
- Consult component checklist
- Update documentation

## Pre-commit Hooks
Pre-commit hooks automatically run checks before each commit to ensure code quality and consistency.

### Available Checks
- ESLint on staged files
- TypeScript type checking
- Case-sensitive path verification
- Component naming convention validation

### Usage
The hooks run automatically when you attempt to commit. If any check fails:
1. Review the error messages
2. Fix the reported issues
3. Stage your changes
4. Try committing again

## Component Generator
A utility to create new components with consistent structure and best practices.

### Usage
```bash
npx ts-node scripts/create-component.ts ComponentName [directory] [flags]
```

### Flags
- `--client`: Create a client component (includes 'use client' directive)
- `--test`: Generate a test file
- `--story`: Generate a Storybook story file

### Example
```bash
# Create a client component with tests and stories in the UI directory
npx ts-node scripts/create-component.ts Button ui --client --test --story
```

## Component Structure Verification
A tool to verify that components follow our naming conventions and best practices.

### Usage
```bash
npx ts-node scripts/verify-component-names.ts
```

### Checks
- File names in PascalCase
- Proper use of 'use client' directive
- Import path casing
- Export naming conventions

### Integration
- Runs automatically in pre-commit hooks
- Can be run manually to check all components
- Integrated into CI pipeline

## Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Type Checking
```bash
# Run type checking
npm run type-check
```

## Linting
```bash
# Run ESLint
npm run lint

# Fix automatically fixable issues
npm run lint:fix
``` 
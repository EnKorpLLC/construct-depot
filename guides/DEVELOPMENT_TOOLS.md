# Development Tools Guide
Last Modified: 2024-01-19

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

## Best Practices
1. Always use the component generator for new components
2. Review the component checklist before creating components
3. Run verification tools regularly
4. Fix issues reported by pre-commit hooks immediately
5. Keep documentation updated when adding new features

## Troubleshooting
### Pre-commit Hooks Failing
1. Check the error messages carefully
2. Run the failing check manually for more detailed output
3. Verify that all dependencies are installed
4. Ensure your code follows the component checklist

### Component Generator Issues
1. Verify the component name is in PascalCase
2. Check that the target directory exists
3. Ensure you have necessary permissions

### Structure Verification Failures
1. Review the reported issues
2. Check the component checklist
3. Use the component generator for new components
4. Update existing components to follow conventions 
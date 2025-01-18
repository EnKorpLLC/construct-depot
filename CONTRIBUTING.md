# Contributing to Bulk Buyer Group
Last Updated: 2024-01-19 13:00

Thank you for your interest in contributing to the Bulk Buyer Group project! This guide will help you understand our development process and standards.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Process](#development-process)
3. [Component Development](#component-development)
4. [Code Style](#code-style)
5. [Testing](#testing)
6. [Pull Request Process](#pull-request-process)
7. [Development Tools](#development-tools)

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

## Development Process

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Run automated checks:
   ```bash
   npm run verify
   ```
4. Commit your changes using conventional commits:
   ```bash
   git commit -m "feat: Add new feature"
   ```
5. Push to your fork and create a pull request

## Component Development

Please follow our [Component Development Checklist](guides/COMPONENT_CHECKLIST.md) when creating or modifying components.

### Key Requirements
1. Use PascalCase for component files
2. Add 'use client' directive when using hooks
3. Place tests in `__tests__` directory
4. Follow import path conventions
5. Include proper TypeScript types

### Automated Checks
The following checks run automatically:
- Component structure verification
- Import path validation
- Test file naming
- ESLint rules
- TypeScript type checking

## Code Style

We use ESLint and Prettier for code formatting. Our configuration enforces:

1. TypeScript strict mode
2. React hooks rules
3. Import path case sensitivity
4. Component naming conventions
5. Accessibility standards

To check your code:
```bash
npm run lint
npm run type-check
```

## Testing

Please refer to our [Testing Guide](docs/development/guides/testing.md) for detailed testing requirements.

### Key Points
1. Write tests for all new components
2. Maintain minimum coverage thresholds
3. Follow test naming conventions
4. Include integration tests for API routes
5. Test error states and edge cases

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Pull Request Process

1. Update documentation
2. Add/update tests
3. Run all checks:
   ```bash
   npm run verify
   ```
4. Create PR with:
   - Clear description
   - Link to related issue
   - Screenshots (if UI changes)
   - Test coverage report

### PR Checklist
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All checks passing
- [ ] Component checklist followed
- [ ] No console errors/warnings
- [ ] Responsive design verified
- [ ] Accessibility tested

## Development Tools

We provide several tools to help maintain code quality:

### 1. Component Generator
```bash
npm run generate:component ComponentName
```

### 2. Verification Scripts
```bash
# Check component structure
npm run verify:components

# Check import paths
npm run verify:imports

# Check test names
npm run verify:tests
```

### 3. Pre-commit Hooks
Automatically run on commit:
- ESLint
- TypeScript checks
- Component verification
- Test naming checks

### 4. CI/CD Pipeline
Runs on pull requests:
- All tests
- Build verification
- Component checks
- Coverage report

## Additional Resources

- [Project Documentation](docs/README.md)
- [Component Checklist](guides/COMPONENT_CHECKLIST.md)
- [Development Tools Guide](guides/DEVELOPMENT_TOOLS.md)
- [Testing Guide](docs/development/guides/testing.md)

## Questions or Issues?

Feel free to:
1. Open an issue
2. Ask in discussions
3. Contact the maintainers

Thank you for contributing to Bulk Buyer Group! 
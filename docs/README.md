# Project Documentation
Last Updated: 2024-01-19 12:45

## Core Documents
- `guides/PROJECT_STATUS.md` - Single source of truth for project status
- `guides/DEVELOPMENT_TOOLS.md` - Development tools and automation
- `guides/COMPONENT_CHECKLIST.md` - Component development standards
- `guides/Verification_Process.md` - Process for verifying project components
- `guides/Documents_to_Verify.md` - List of documents requiring verification
- `guides/startup-process.md` - Development environment setup guide
- `guides/load-testing-strategy.md` - Load testing procedures and requirements

## Development Tools
- Component Structure Verification
- Import Path Checker
- Test File Naming Tool
- ESLint Configuration
- Pre-commit Hooks
- CI Integration

## Deployment Documentation
- `guides/MANUAL_DEPLOYMENT_STEPS.md` - Step-by-step manual deployment guide
- `guides/DEPLOYMENT_CHECKLIST.md` - Pre and post deployment checks
- `guides/POST_DEPLOYMENT_VERIFICATION.md` - Verification procedures

## Service Configuration
- `guides/SERVICE_CONFIGURATION.md` - Service setup and configuration
- `guides/INTEGRATIONS.md` - Third-party service integrations
- `guides/MONITORING_SETUP.md` - Monitoring and alerting setup

## Directory Structure
```
guides/
├── Core Documentation
│   ├── PROJECT_STATUS.md
│   ├── DEVELOPMENT_TOOLS.md
│   ├── COMPONENT_CHECKLIST.md
│   ├── Verification_Process.md
│   └── Documents_to_Verify.md
├── Development
│   ├── startup-process.md
│   └── load-testing-strategy.md
├── Deployment
│   ├── MANUAL_DEPLOYMENT_STEPS.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   └── POST_DEPLOYMENT_VERIFICATION.md
└── Configuration
    ├── SERVICE_CONFIGURATION.md
    ├── INTEGRATIONS.md
    └── MONITORING_SETUP.md
```

## Document Maintenance
- All documents should be reviewed and updated with each sprint
- Timestamps must be included in all updates
- Cross-reference between documents should be maintained
- Follow markdown best practices for consistency

## Recent Updates
- Added automated component verification tools (2024-01-19)
- Enhanced ESLint configuration with component rules (2024-01-19)
- Added component development checklist (2024-01-19)
- Updated development tools documentation (2024-01-19)
- Added GitHub Actions workflow for component checks (2024-01-19)
- Updated manual deployment steps (2024-01-19)
- Added service configuration guides (2024-01-19)
- Updated project status (2024-01-19)

## Component Development
See `guides/COMPONENT_CHECKLIST.md` for:
- Component structure guidelines
- Naming conventions
- Client/Server separation
- Testing requirements
- Import path standards
- Type safety requirements

## Automated Checks
The following checks run automatically in CI:
1. Component Structure Verification
   - File naming conventions
   - Export naming
   - Directory structure
   
2. Import Path Validation
   - Correct casing
   - Valid paths
   - Proper module resolution
   
3. Test File Verification
   - Naming conventions
   - Location in __tests__ directory
   
4. ESLint Validation
   - Component rules
   - Import/export rules
   - React hooks rules
   
5. TypeScript Checks
   - Type safety
   - Prop types
   - Return types

// ... existing code ... 
# Construct Depot Bulk Buying Platform

Last Updated: 2025-01-29

## Overview

The Construct Depot Bulk Buying Platform is a comprehensive solution for managing bulk purchases of construction materials and supplies. This platform enables contractors, suppliers, and project managers to streamline their procurement processes through automated ordering, real-time inventory tracking, and collaborative purchasing.

## Production Environment

- **Application URL**: https://app.constructdepot.com
- **API Endpoint**: https://api.constructdepot.com
- **WebSocket**: wss://api.constructdepot.com

## Project Structure

The project is organized into the following main directories:

```typescript
/
├── docs/                    # Documentation root
│   ├── api/                # API documentation
│   │   ├── authentication/ # Authentication guides
│   │   ├── endpoints/      # API endpoint documentation
│   │   ├── examples/       # Code examples and usage
│   │   ├── monitoring/     # Monitoring and logging
│   │   ├── performance/    # Performance guides
│   │   ├── schema/         # Database schema
│   │   └── security/       # Security guidelines
│   ├── deployment/         # Deployment documentation
│   ├── development/        # Development documentation
│   └── testing/           # Testing documentation
├── src/                    # Source code
│   ├── components/        # React components
│   ├── services/          # Business logic services
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
├── scripts/               # Development and build scripts
├── tests/                 # Test files
└── config/               # Configuration files
```

## Documentation Organization

- **API Documentation**: Comprehensive guides for API integration, authentication, endpoints, and best practices
- **Development Guides**: Setup instructions, contribution guidelines, and development standards
- **Testing Documentation**: Testing strategies, tools, and procedures
- **Deployment Guides**: Deployment procedures, infrastructure setup, and monitoring

## Initial Setup

1. Install dependencies:
```bash
npm install
```

2. Copy and configure environment variables:
```bash
cp .env.example .env
```

3. Run verification scripts in order:
```bash
npm run normalize-endings    # Normalize line endings
npm run update-timestamps   # Update documentation timestamps
npm run check-docs         # Validate documentation
npm run find-duplicates    # Check for duplicate code
npm run check-references   # Validate cross-references
npm run fix-docs          # Fix common documentation issues
```

## Development

Start the development server:
```bash
npm run dev
```

## Deployment

Deploy to production:
```bash
npm run deploy
```

Verify deployment:
```bash
npm run deploy:verify
```

## Testing

Run all tests:
```bash
npm test                 # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:load       # Load tests
```

## Infrastructure

- **Web Server**: Nginx with HTTP/2 and SSL
- **Database**: PostgreSQL 15
- **Caching**: Redis Cluster
- **Monitoring**: Datadog

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
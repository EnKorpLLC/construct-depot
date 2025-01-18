# Construct Depot Bulk Buying Platform

A modern web application for managing bulk building material purchases and sales, connecting contractors, and streamlining construction material procurement.

## Features

- Bulk order aggregation system
- Supplier management and dashboard
- Real-time order tracking
- Shipping and logistics management
- Take-off service from blueprints
- Contractor bidding platform
- Multi-role user system
- Analytics and reporting

## Tech Stack

### Frontend
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Chart.js for analytics
- date-fns for date handling
- next-auth for authentication

### Infrastructure
- PostgreSQL with Prisma ORM
- Redis for caching
- Jest and React Testing Library
- GitHub Actions for CI/CD

### Development Tools
- ESLint with custom rules
- Pre-commit hooks for quality checks
- Component generator for consistency
- Structure verification tools
- Automated testing suite

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- Git
- PostgreSQL
- Redis

### Installation

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Start development server
```bash
npm run dev
```

## Development Process

### Creating Components
Use the component generator to create new components:
```bash
npx ts-node scripts/create-component.ts ComponentName [directory] [flags]
```

See [Development Tools Guide](guides/DEVELOPMENT_TOOLS.md) for available flags and options.

### Quality Checks
Pre-commit hooks automatically run:
- ESLint
- Type checking
- Component structure verification
- Case-sensitive path checks

### Component Guidelines
Follow the [Component Checklist](guides/COMPONENT_CHECKLIST.md) for:
- Naming conventions
- File structure
- Client/Server separation
- Testing requirements

## Project Structure

```
├── frontend/              # Frontend application
│   ├── src/              # Source files
│   │   ├── app/         # Next.js App Router pages
│   │   ├── components/  # React components
│   │   ├── lib/        # Utilities and services
│   │   └── types/      # TypeScript types
│   ├── public/          # Static files
│   └── prisma/          # Database schema and migrations
├── docs/                # Documentation
├── guides/             # Development guides
└── .github/            # GitHub Actions and configs
```

## Documentation

Please refer to the following guides:
- [Development Tools Guide](guides/DEVELOPMENT_TOOLS.md)
- [Component Checklist](guides/COMPONENT_CHECKLIST.md)
- [Project Status](guides/PROJECT_STATUS.md)
- [API Reference](docs/README.md)
- [Testing Guidelines](docs/testing.md)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details 
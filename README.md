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
└── .github/            # GitHub Actions and configs
```

## Documentation

Please refer to the [documentation](docs/README.md) for:
- API Reference
- Component Documentation
- Development Guides
- User Guides
- Testing Guidelines

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details 
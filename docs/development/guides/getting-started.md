# Getting Started with Development

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git
- A code editor (VS Code recommended)

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone [repository-url]
   cd construct-depot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update the environment variables as needed
   - Ensure database connection details are properly configured

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Project Structure
```
frontend/
├── src/
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   ├── lib/           # Utility functions and services
│   └── styles/        # CSS and styling
├── public/            # Static assets
└── prisma/           # Database schema and migrations
```

## Key Features
- Order Management System
- Inventory Tracking
- User Authentication
- Dashboard Components
- AI Web Crawler
- Enhanced Validation Rules

## Development Workflow
1. Create a new branch for your feature
2. Implement changes following our coding standards
3. Write tests for new functionality
4. Submit a pull request
5. Address review comments

## Testing
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run linter

## Useful Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Project Wiki](internal-wiki-link)
- [API Documentation](/technical/api/overview.md)

## Need Help?
- Check the [Troubleshooting Guide](/technical/guides/troubleshooting.md)
- Contact the development team
- Review existing issues on GitHub 
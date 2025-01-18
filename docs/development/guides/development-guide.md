# Development Guide

## Getting Started

### Prerequisites
- Node.js 18.x or later
- PostgreSQL 14.x or later
- Git
- npm or yarn
- VS Code (recommended)

### Initial Setup
1. Clone the repository:
```bash
git clone https://github.com/your-org/bulk-buyer-group.git
cd bulk-buyer-group
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bulk_buyer_db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

5. Initialize the database:
```bash
npx prisma migrate dev
npx prisma generate
```

6. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Production hotfixes

### Creating a New Feature
1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git add .
git commit -m "feat: your feature description"
```

3. Push changes and create a pull request:
```bash
git push origin feature/your-feature-name
```

### Code Style
- Follow ESLint configuration
- Use Prettier for formatting
- Follow TypeScript best practices
- Write meaningful commit messages

## Project Structure

### Directory Layout
```
├── docs/                 # Documentation
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── src/
│   ├── app/            # Next.js pages and API routes
│   ├── components/     # React components
│   ├── lib/           # Utilities and services
│   └── types/         # TypeScript types
├── tests/              # Test files
└── package.json        # Project configuration
```

### Key Files
- `next.config.js`: Next.js configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `prisma/schema.prisma`: Database schema
- `.env.example`: Environment variables template

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

### Writing Tests
```typescript
import { render, screen } from '@testing-library/react'
import YourComponent from './YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

## Database Management

### Migrations
```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Prisma Studio
```bash
npx prisma studio
```

## API Development

### Creating a New API Route
1. Create a new file in `src/app/api`:
```typescript
// src/app/api/your-route/route.ts
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    // Your logic here
    return NextResponse.json({ data: 'your data' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error message' },
      { status: 500 }
    )
  }
}
```

2. Add validation:
```typescript
import { z } from 'zod'

const schema = z.object({
  field: z.string(),
  number: z.number(),
})
```

### Error Handling
```typescript
try {
  // Your logic
} catch (error) {
  if (error instanceof PrismaError) {
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    )
  }
  return NextResponse.json(
    { error: 'Unknown error' },
    { status: 500 }
  )
}
```

## Component Development

### Creating a New Component
1. Create component file:
```typescript
// src/components/YourComponent.tsx
import { FC } from 'react'

interface Props {
  title: string
  onClick: () => void
}

export const YourComponent: FC<Props> = ({ title, onClick }) => {
  return (
    <div onClick={onClick}>
      <h1>{title}</h1>
    </div>
  )
}
```

2. Add styles:
```typescript
import { cn } from '@/lib/utils'

export const YourComponent: FC<Props> = ({ 
  title, 
  onClick,
  className 
}) => {
  return (
    <div 
      className={cn(
        'base-styles',
        className
      )}
      onClick={onClick}
    >
      <h1>{title}</h1>
    </div>
  )
}
```

### Component Best Practices
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Use React.memo for optimization
- Follow accessibility guidelines

## State Management

### Using React Context
```typescript
// src/lib/contexts/YourContext.tsx
import { createContext, useContext, useState } from 'react'

const YourContext = createContext<YourContextType | undefined>(undefined)

export function YourProvider({ children }) {
  const [state, setState] = useState(initialState)

  return (
    <YourContext.Provider value={{ state, setState }}>
      {children}
    </YourContext.Provider>
  )
}

export function useYourContext() {
  const context = useContext(YourContext)
  if (context === undefined) {
    throw new Error('useYourContext must be used within a YourProvider')
  }
  return context
}
```

### Using SWR
```typescript
import useSWR from 'swr'

function YourComponent() {
  const { data, error } = useSWR('/api/data', fetcher)

  if (error) return <div>Error loading data</div>
  if (!data) return <div>Loading...</div>

  return <div>{data.title}</div>
}
```

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy:
```bash
git push origin main
```

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Troubleshooting

### Common Issues
1. Database Connection
```bash
# Check database status
pg_isready -h localhost -p 5432

# Reset database
npx prisma migrate reset
```

2. Next.js Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

3. Dependency Issues
```bash
# Clear node_modules
rm -rf node_modules
rm package-lock.json

# Reinstall
npm install
```

### Debug Tools
- Chrome DevTools
- React Developer Tools
- Prisma Studio
- Next.js Debug Mode

## Performance Optimization

### Frontend Optimization
- Use Image component
- Implement lazy loading
- Optimize bundle size
- Use proper caching

### API Optimization
- Implement rate limiting
- Use proper indexing
- Cache responses
- Optimize queries

## Security Guidelines

### Best Practices
- Validate all inputs
- Sanitize user data
- Use HTTPS
- Implement CORS
- Follow OWASP guidelines

### Authentication
- Use secure sessions
- Implement proper logout
- Handle token expiration
- Validate permissions

## Contributing

### Pull Request Process
1. Create feature branch
2. Make changes
3. Write tests
4. Update documentation
5. Create pull request
6. Wait for review

### Code Review Guidelines
- Check for TypeScript errors
- Verify test coverage
- Review security implications
- Check performance impact
- Validate documentation 
# Component Development Checklist

Last Updated: 2024-01-19

## Component Creation Guidelines

### Client vs Server Components
- [ ] Determine if the component needs client-side interactivity
- [ ] Add `'use client'` directive if using:
  - React hooks (useState, useEffect, etc.)
  - Browser APIs
  - Event handlers
  - Client-side routing
- [ ] Place directive at the very top of the file
- [ ] Consider splitting into client/server components for better performance

### File Structure and Naming
- [ ] Use PascalCase for component files (e.g., `Button.tsx`, `UserProfile.tsx`)
- [ ] Use kebab-case for non-component files (e.g., `api-utils.ts`)
- [ ] Place components in appropriate directory structure
- [ ] Ensure file name matches component name

### Imports and Exports
- [ ] Use consistent import paths with `@/` prefix
- [ ] Match import path casing exactly with file system
- [ ] Use named exports for utility functions
- [ ] Use default exports for main components

### Type Safety
- [ ] Define proper TypeScript interfaces for props
- [ ] Use proper type imports
- [ ] Avoid using `any` type
- [ ] Document complex prop types

### Performance Considerations
- [ ] Implement proper error boundaries
- [ ] Use appropriate loading states
- [ ] Consider implementing Suspense boundaries
- [ ] Optimize re-renders with useMemo/useCallback where needed

### Testing
- [ ] Write unit tests for component logic
- [ ] Include integration tests for complex interactions
- [ ] Test error states and loading states
- [ ] Verify responsive behavior

## Common Issues Prevention

### Server Component Issues
```typescript
// ❌ Wrong - Using hooks without 'use client'
import { useState } from 'react';
export default function Component() {
  const [state, setState] = useState();
  // ...
}

// ✅ Correct - Adding 'use client' directive
'use client';
import { useState } from 'react';
export default function Component() {
  const [state, setState] = useState();
  // ...
}
```

### Import Path Issues
```typescript
// ❌ Wrong - Incorrect casing
import { button } from '@/components/ui/button';

// ✅ Correct - Matching file system casing
import { Button } from '@/components/ui/Button';
```

### Type Safety Issues
```typescript
// ❌ Wrong - Using any
interface Props {
  data: any;
}

// ✅ Correct - Proper typing
interface Props {
  data: {
    id: string;
    name: string;
    value: number;
  };
}
```

## Deployment Considerations
- [ ] Verify component works in production build
- [ ] Check for any environment-specific code
- [ ] Ensure all dependencies are properly listed
- [ ] Test component in deployment environment

## Code Review Checklist
- [ ] Follow component naming conventions
- [ ] Verify proper use of 'use client' directive
- [ ] Check import path casing
- [ ] Review type safety
- [ ] Verify error handling
- [ ] Check for performance optimizations
- [ ] Ensure proper testing coverage

## Notes
- Keep components focused and single-responsibility
- Consider extracting complex logic into custom hooks
- Document any non-obvious implementation details
- Follow the established project patterns 
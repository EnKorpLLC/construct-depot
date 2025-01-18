# Contributing Guidelines

## Introduction
Thank you for considering contributing to the Bulk Buyer Group project! This document provides guidelines and instructions for contributing to our codebase.

## Code of Conduct
Please read and follow our Code of Conduct to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites
- Node.js 18.x or later
- PostgreSQL 14.x or later
- Git
- npm or yarn

### Setting Up Development Environment
1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/bulk-buyer-group.git
cd bulk-buyer-group
```

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

### Branch Naming Convention
- Feature: `feature/your-feature-name`
- Bugfix: `bugfix/issue-description`
- Hotfix: `hotfix/critical-fix`
- Release: `release/version-number`

### Commit Message Format
Follow the Conventional Commits specification:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance tasks

Example:
```
feat(orders): add order pooling functionality

- Implement order pooling service
- Add pooling validation rules
- Create pooling UI components

Closes #123
```

### Pull Request Process
1. Create a new branch from `develop`
2. Make your changes
3. Write/update tests
4. Update documentation
5. Run tests and linting
6. Push changes
7. Create pull request

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Added TODO comments
- [ ] Updated CHANGELOG.md
```

## Code Standards

### TypeScript Guidelines
- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any`
- Use proper error handling

Example:
```typescript
interface OrderData {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
}

async function getOrder(id: string): Promise<OrderData> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}
```

### React Guidelines
- Use functional components
- Implement proper error boundaries
- Follow React hooks rules
- Use proper prop types

Example:
```typescript
interface OrderProps {
  orderId: string;
  onStatusChange: (status: OrderStatus) => void;
}

const Order: React.FC<OrderProps> = ({ orderId, onStatusChange }) => {
  const { data, error } = useSWR(`/api/orders/${orderId}`, fetcher);

  if (error) return <ErrorComponent error={error} />;
  if (!data) return <LoadingSpinner />;

  return (
    <div>
      <h2>Order {orderId}</h2>
      <OrderDetails data={data} />
    </div>
  );
};
```

### Testing Guidelines
- Write unit tests for all new code
- Maintain test coverage above 80%
- Use meaningful test descriptions
- Follow AAA pattern (Arrange, Act, Assert)

Example:
```typescript
describe('OrderService', () => {
  describe('validateOrder', () => {
    it('should validate order successfully', async () => {
      // Arrange
      const order = createTestOrder();
      
      // Act
      const result = await orderService.validateOrder(order);
      
      // Assert
      expect(result.isValid).toBe(true);
    });
  });
});
```

## Documentation

### Code Documentation
- Use JSDoc for function documentation
- Document complex logic
- Keep comments up to date
- Include examples for complex functions

Example:
```typescript
/**
 * Validates an order for pooling eligibility
 * @param order - The order to validate
 * @param poolingRules - Custom pooling rules to apply
 * @returns ValidationResult with status and messages
 * @throws ValidationError if order is invalid
 */
async function validatePoolingEligibility(
  order: Order,
  poolingRules?: PoolingRules
): Promise<ValidationResult> {
  // Implementation
}
```

### API Documentation
- Document all API endpoints
- Include request/response examples
- Document error responses
- Keep OpenAPI spec updated

## Review Process

### Code Review Guidelines
- Review code within 48 hours
- Check code style and standards
- Verify test coverage
- Review documentation updates
- Test functionality locally

### Review Checklist
1. Code Quality
   - Follows style guide
   - No code smells
   - Proper error handling
   - Efficient algorithms

2. Testing
   - Tests pass
   - Adequate coverage
   - Edge cases covered
   - Performance tests

3. Documentation
   - Code comments
   - API documentation
   - README updates
   - CHANGELOG updates

## Support

### Getting Help
- Check existing documentation
- Search closed issues
- Ask in Discord channel
- Create new issue

### Reporting Issues
- Use issue templates
- Include reproduction steps
- Attach relevant logs
- Tag appropriately

## License
By contributing, you agree that your contributions will be licensed under the project's MIT License. 
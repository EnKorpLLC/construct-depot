import { faker } from '@faker-js/faker';

// User related mocks
export const generateUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: faker.helpers.arrayElement(['ADMIN', 'USER', 'SUPPLIER']),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

// Order related mocks
export const generateOrder = (overrides = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  status: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']),
  total: faker.number.float({ min: 10, max: 1000, precision: 2 }),
  items: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, generateOrderItem),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const generateOrderItem = (overrides = {}) => ({
  id: faker.string.uuid(),
  productId: faker.string.uuid(),
  quantity: faker.number.int({ min: 1, max: 10 }),
  price: faker.number.float({ min: 5, max: 200, precision: 2 }),
  ...overrides,
});

// Product related mocks
export const generateProduct = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: faker.number.float({ min: 1, max: 1000, precision: 2 }),
  stock: faker.number.int({ min: 0, max: 100 }),
  category: faker.commerce.department(),
  images: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => faker.image.url()),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

// Activity related mocks
export const generateActivity = (overrides = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  type: faker.helpers.arrayElement(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']),
  entity: faker.helpers.arrayElement(['USER', 'ORDER', 'PRODUCT', 'SYSTEM']),
  entityId: faker.string.uuid(),
  details: {
    action: faker.helpers.arrayElement(['created', 'updated', 'deleted', 'accessed']),
    changes: faker.helpers.arrayElement([{}, { name: 'updated name' }, { status: 'changed status' }]),
  },
  createdAt: faker.date.recent().toISOString(),
  ...overrides,
});

// Crawler related mocks
export const generateCrawlerJob = (overrides = {}) => ({
  id: faker.string.uuid(),
  url: faker.internet.url(),
  status: faker.helpers.arrayElement(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']),
  progress: faker.number.int({ min: 0, max: 100 }),
  results: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, generateCrawlerResult),
  error: faker.helpers.maybe(() => faker.string.sample(50)),
  startedAt: faker.date.past().toISOString(),
  completedAt: faker.helpers.maybe(() => faker.date.recent().toISOString()),
  ...overrides,
});

export const generateCrawlerResult = (overrides = {}) => ({
  id: faker.string.uuid(),
  url: faker.internet.url(),
  title: faker.commerce.productName(),
  price: faker.number.float({ min: 1, max: 1000, precision: 2 }),
  availability: faker.helpers.arrayElement(['IN_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER']),
  metadata: {
    seller: faker.company.name(),
    rating: faker.number.float({ min: 1, max: 5, precision: 1 }),
    reviews: faker.number.int({ min: 0, max: 1000 }),
  },
  ...overrides,
});

// Validation related mocks
export const generateValidationError = (overrides = {}) => ({
  field: faker.helpers.arrayElement(['email', 'password', 'name', 'quantity', 'price']),
  message: faker.string.sample(30),
  code: faker.helpers.arrayElement(['REQUIRED', 'INVALID_FORMAT', 'TOO_SHORT', 'TOO_LONG']),
  ...overrides,
});

// API Response mocks
export const generateApiResponse = (data: any, overrides = {}) => ({
  success: true,
  data,
  timestamp: faker.date.recent().toISOString(),
  ...overrides,
});

export const generateApiError = (overrides = {}) => ({
  success: false,
  error: {
    message: faker.string.sample(50),
    code: faker.helpers.arrayElement(['NOT_FOUND', 'UNAUTHORIZED', 'VALIDATION_ERROR', 'SERVER_ERROR']),
    details: faker.helpers.maybe(() => Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, generateValidationError)),
  },
  timestamp: faker.date.recent().toISOString(),
  ...overrides,
}); 
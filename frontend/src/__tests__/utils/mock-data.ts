export const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'USER',
};

export const mockAdmin = {
  id: '2',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMIN',
};

export const mockProduct = {
  id: '1',
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  minQuantity: 10,
  currentPool: {
    id: '1',
    currentQuantity: 5,
    targetQuantity: 10,
    status: 'OPEN',
  },
};

export const mockOrder = {
  id: '1',
  userId: '1',
  status: 'PENDING',
  items: [
    {
      productId: '1',
      quantity: 2,
      price: 99.99,
    },
  ],
  total: 199.98,
  createdAt: new Date().toISOString(),
};

export const mockPool = {
  id: '1',
  productId: '1',
  currentQuantity: 5,
  targetQuantity: 10,
  status: 'OPEN',
  participants: [
    {
      userId: '1',
      quantity: 2,
    },
    {
      userId: '2',
      quantity: 3,
    },
  ],
};

// Add more mock data as needed 
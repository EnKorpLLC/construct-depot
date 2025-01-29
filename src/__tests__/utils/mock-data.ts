import { OrderStatus, UserRole } from '@prisma/client';

export const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: UserRole.CUSTOMER,
};

export const mockAdmin = {
  id: '2',
  name: 'Admin User',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
};

export const mockProduct = {
  id: '1',
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  currentStock: 100,
  lowStockThreshold: 20,
  reorderPoint: 30,
  reorderQuantity: 50,
  supplierId: 'supplier-1',
};

export const mockOrder = {
  id: '1',
  userId: '1',
  status: OrderStatus.PENDING,
  items: [
    {
      id: 'item-1',
      productId: '1',
      quantity: 2,
      price: 99.99,
      product: mockProduct,
    },
  ],
  total: 199.98,
  tax: 20.00,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: mockUser,
  shippingAddress: '123 Test St',
  shippingCity: 'Test City',
  shippingState: 'TS',
  shippingZip: '12345',
};

export const mockPooledOrder = {
  id: 'pool-1',
  supplierId: 'supplier-1',
  status: OrderStatus.POOLING,
  orders: [mockOrder],
  totalQuantity: 2,
  threshold: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Add test cases
describe('Mock Data', () => {
  it('should have valid user data', () => {
    expect(mockUser.id).toBeDefined();
    expect(mockUser.role).toBe(UserRole.CUSTOMER);
  });

  it('should have valid admin data', () => {
    expect(mockAdmin.id).toBeDefined();
    expect(mockAdmin.role).toBe(UserRole.ADMIN);
  });

  it('should have valid product data', () => {
    expect(mockProduct.id).toBeDefined();
    expect(mockProduct.currentStock).toBeGreaterThan(0);
  });

  it('should have valid order data', () => {
    expect(mockOrder.id).toBeDefined();
    expect(mockOrder.items.length).toBeGreaterThan(0);
    expect(mockOrder.status).toBe(OrderStatus.PENDING);
  });

  it('should have valid pooled order data', () => {
    expect(mockPooledOrder.id).toBeDefined();
    expect(mockPooledOrder.orders.length).toBeGreaterThan(0);
    expect(mockPooledOrder.status).toBe(OrderStatus.POOLING);
  });
}); 
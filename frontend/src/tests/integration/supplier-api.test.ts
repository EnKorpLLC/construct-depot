import { createServer } from '@/lib/test-server';
import { prisma } from '@/lib/prisma';
import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth';

jest.mock('next-auth');

describe('Supplier Dashboard API Integration', () => {
  const server = createServer();
  
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear test data
    await prisma.$transaction([
      prisma.order.deleteMany(),
      prisma.product.deleteMany(),
      prisma.customer.deleteMany(),
    ]);

    // Mock authentication
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'test-supplier-id',
        role: 'SUPPLIER'
      }
    });
  });

  describe('GET /api/supplier/orders', () => {
    it('returns paginated orders for supplier', async () => {
      // Create test orders
      await prisma.order.createMany({
        data: [
          {
            orderNumber: 'ORD-001',
            supplierId: 'test-supplier-id',
            status: 'pending',
            total: 1000,
          },
          {
            orderNumber: 'ORD-002',
            supplierId: 'test-supplier-id',
            status: 'processing',
            total: 2000,
          }
        ]
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '10' }
      });

      await server.apiRoute(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.orders).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('filters orders by status', async () => {
      // Create test orders with different statuses
      await prisma.order.createMany({
        data: [
          { status: 'pending', supplierId: 'test-supplier-id' },
          { status: 'processing', supplierId: 'test-supplier-id' },
          { status: 'processing', supplierId: 'test-supplier-id' }
        ]
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { status: 'processing' }
      });

      await server.apiRoute(req, res);

      const data = JSON.parse(res._getData());
      expect(data.orders).toHaveLength(2);
      expect(data.orders.every(o => o.status === 'processing')).toBe(true);
    });
  });

  describe('GET /api/supplier/analytics/sales', () => {
    it('returns sales data for specified timeframe', async () => {
      // Create test orders with different dates
      await prisma.order.createMany({
        data: Array.from({ length: 5 }, (_, i) => ({
          supplierId: 'test-supplier-id',
          status: 'delivered',
          total: 1000,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        }))
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { timeframe: 'week' }
      });

      await server.apiRoute(req, res);

      const data = JSON.parse(res._getData());
      expect(data.labels).toHaveLength(7);
      expect(data.revenue).toHaveLength(7);
      expect(data.orders).toHaveLength(7);
    });
  });

  describe('GET /api/supplier/analytics/customers', () => {
    it('returns customer insights data', async () => {
      // Create test customers and orders
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          orders: {
            createMany: {
              data: Array.from({ length: 3 }, () => ({
                supplierId: 'test-supplier-id',
                total: 1000,
                status: 'delivered'
              }))
            }
          }
        }
      });

      const { req, res } = createMocks({
        method: 'GET'
      });

      await server.apiRoute(req, res);

      const data = JSON.parse(res._getData());
      expect(data.totalCustomers).toBe(1);
      expect(data.topCustomers).toHaveLength(1);
      expect(data.customerSegments).toBeDefined();
    });
  });

  describe('GET /api/supplier/inventory', () => {
    it('returns inventory overview', async () => {
      // Create test products
      await prisma.product.createMany({
        data: [
          {
            supplierId: 'test-supplier-id',
            name: 'Test Product 1',
            currentStock: 5,
            reorderPoint: 10
          },
          {
            supplierId: 'test-supplier-id',
            name: 'Test Product 2',
            currentStock: 20,
            reorderPoint: 10
          }
        ]
      });

      const { req, res } = createMocks({
        method: 'GET'
      });

      await server.apiRoute(req, res);

      const data = JSON.parse(res._getData());
      expect(data.totalProducts).toBe(2);
      expect(data.lowStockItems).toBe(1);
      expect(data.products).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('returns 401 for unauthenticated requests', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/supplier/orders'
      });

      await server.apiRoute(req, res);
      expect(res._getStatusCode()).toBe(401);
    });

    it('returns 403 for non-supplier users', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'test-user-id',
          role: 'CUSTOMER'
        }
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/supplier/orders'
      });

      await server.apiRoute(req, res);
      expect(res._getStatusCode()).toBe(403);
    });

    it('handles database errors gracefully', async () => {
      // Mock a database error
      jest.spyOn(prisma.order, 'findMany').mockRejectedValue(new Error('DB Error'));

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/supplier/orders'
      });

      await server.apiRoute(req, res);
      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toHaveProperty('error');
    });
  });
}); 
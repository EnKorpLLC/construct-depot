import { createServer } from '@/lib/test-server';
import { prisma } from '@/lib/prisma';
import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

describe('Notification API Integration Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'CUSTOMER'
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
    
    (getServerSession as jest.Mock).mockResolvedValue({
      user: mockUser
    });
  });

  describe('GET /api/notifications', () => {
    it('should return paginated notifications for authenticated user', async () => {
      // Create test notifications
      await prisma.notification.createMany({
        data: [
          {
            userId: mockUser.id,
            type: 'ORDER_STATUS_CHANGE',
            title: 'Order Shipped',
            message: 'Your order has been shipped',
            read: false,
            createdAt: new Date()
          },
          {
            userId: mockUser.id,
            type: 'POOL_PROGRESS',
            title: 'Pool Update',
            message: 'Pool is 75% complete',
            read: true,
            createdAt: new Date(),
            metadata: { progress: 75 }
          }
        ]
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { limit: '10', offset: '0' }
      });

      const handler = createServer().getRequestHandler();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.notifications).toHaveLength(2);
      expect(data.notifications[0]).toHaveProperty('type', 'ORDER_STATUS_CHANGE');
    });

    it('should handle invalid pagination parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { limit: 'invalid', offset: 'invalid' }
      });

      const handler = createServer().getRequestHandler();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should return empty array when no notifications exist', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { limit: '10', offset: '0' }
      });

      const handler = createServer().getRequestHandler();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.notifications).toHaveLength(0);
    });
  });

  describe('POST /api/notifications/mark-read', () => {
    it('should mark notifications as read', async () => {
      // Create test notification
      const notification = await prisma.notification.create({
        data: {
          userId: mockUser.id,
          type: 'ORDER_STATUS_CHANGE',
          title: 'New Order',
          message: 'You have a new order',
          read: false,
          createdAt: new Date()
        }
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: { notificationIds: [notification.id] }
      });

      const handler = createServer().getRequestHandler();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const updatedNotification = await prisma.notification.findUnique({
        where: { id: notification.id }
      });
      expect(updatedNotification?.read).toBe(true);
    });

    it('should handle invalid notification IDs', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { notificationIds: ['invalid-id'] }
      });

      const handler = createServer().getRequestHandler();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return correct unread count', async () => {
      await prisma.notification.createMany({
        data: [
          {
            userId: mockUser.id,
            type: 'ORDER_STATUS_CHANGE',
            title: 'Order 1',
            message: 'Update 1',
            read: false,
            createdAt: new Date()
          },
          {
            userId: mockUser.id,
            type: 'ORDER_STATUS_CHANGE',
            title: 'Order 2',
            message: 'Update 2',
            read: false,
            createdAt: new Date()
          },
          {
            userId: mockUser.id,
            type: 'ORDER_STATUS_CHANGE',
            title: 'Order 3',
            message: 'Update 3',
            read: true,
            createdAt: new Date()
          }
        ]
      });

      const { req, res } = createMocks({
        method: 'GET'
      });

      const handler = createServer().getRequestHandler();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.count).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthenticated requests', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET'
      });

      const handler = createServer().getRequestHandler();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      jest.spyOn(prisma.notification, 'findMany').mockRejectedValue(new Error('Database error'));

      const { req, res } = createMocks({
        method: 'GET'
      });

      const handler = createServer().getRequestHandler();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });
}); 
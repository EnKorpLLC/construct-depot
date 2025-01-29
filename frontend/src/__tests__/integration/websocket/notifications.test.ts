import { createServer } from '@/lib/test-server';
import { WebSocket, Server } from 'ws';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/services/NotificationService';
import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth';

describe('WebSocket Notification Tests', () => {
  let wss: Server;
  let wsClient: WebSocket;
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'CUSTOMER'
  };

  beforeAll(async () => {
    // Setup WebSocket server
    const server = createServer();
    wss = new Server({ server });
    await new Promise(resolve => server.listen(0, resolve));
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();

    (getServerSession as jest.Mock).mockResolvedValue({
      user: mockUser
    });

    // Create WebSocket client connection
    const address = wss.address();
    wsClient = new WebSocket(`ws://localhost:${(address as any).port}`);
    await new Promise(resolve => wsClient.on('open', resolve));
  });

  afterEach(async () => {
    wsClient.close();
    await new Promise(resolve => wsClient.on('close', resolve));
  });

  afterAll(async () => {
    wss.close();
  });

  describe('Real-time Notifications', () => {
    it('should send notification when order status changes', async () => {
      // Setup message handler
      const messagePromise = new Promise(resolve => {
        wsClient.on('message', data => {
          resolve(JSON.parse(data.toString()));
        });
      });

      // Create order status change notification
      await NotificationService.createOrderStatusNotification({
        userId: mockUser.id,
        orderId: 'test-order-id',
        fromStatus: 'PENDING',
        toStatus: 'PROCESSING'
      });

      // Wait for notification
      const message: any = await messagePromise;
      expect(message.type).toBe('ORDER_STATUS_CHANGE');
      expect(message.orderId).toBe('test-order-id');
    });

    it('should send notification when pool progress updates', async () => {
      const messagePromise = new Promise(resolve => {
        wsClient.on('message', data => {
          resolve(JSON.parse(data.toString()));
        });
      });

      await NotificationService.createPoolProgressNotification({
        userId: mockUser.id,
        poolId: 'test-pool-id',
        progress: 75,
        currentQuantity: 150,
        targetQuantity: 200
      });

      const message: any = await messagePromise;
      expect(message.type).toBe('POOL_PROGRESS');
      expect(message.metadata.progress).toBe(75);
    });

    it('should handle multiple concurrent connections', async () => {
      // Create second client
      const wsClient2 = new WebSocket(`ws://localhost:${(wss.address() as any).port}`);
      await new Promise(resolve => wsClient2.on('open', resolve));

      // Setup message handlers for both clients
      const messagePromise1 = new Promise(resolve => {
        wsClient.on('message', data => {
          resolve(JSON.parse(data.toString()));
        });
      });

      const messagePromise2 = new Promise(resolve => {
        wsClient2.on('message', data => {
          resolve(JSON.parse(data.toString()));
        });
      });

      // Create notification
      await NotificationService.createSystemNotification({
        userId: mockUser.id,
        title: 'Test Notification',
        message: 'This is a test'
      });

      // Wait for both clients to receive notification
      const [message1, message2] = await Promise.all([messagePromise1, messagePromise2]);
      expect(message1).toEqual(message2);

      wsClient2.close();
    });
  });

  describe('Connection Management', () => {
    it('should handle client disconnection gracefully', async () => {
      wsClient.close();
      await new Promise(resolve => wsClient.on('close', resolve));

      // Verify server still running
      expect(wss.clients.size).toBe(0);
    });

    it('should reconnect and receive missed notifications', async () => {
      // Close connection
      wsClient.close();
      await new Promise(resolve => wsClient.on('close', resolve));

      // Create notification while disconnected
      await NotificationService.createSystemNotification({
        userId: mockUser.id,
        title: 'Missed Notification',
        message: 'Created while disconnected'
      });

      // Reconnect
      wsClient = new WebSocket(`ws://localhost:${(wss.address() as any).port}`);
      await new Promise(resolve => wsClient.on('open', resolve));

      // Setup message handler
      const messagePromise = new Promise(resolve => {
        wsClient.on('message', data => {
          resolve(JSON.parse(data.toString()));
        });
      });

      // Should receive missed notification
      const message: any = await messagePromise;
      expect(message.title).toBe('Missed Notification');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid messages gracefully', async () => {
      const errorPromise = new Promise(resolve => {
        wsClient.on('error', resolve);
      });

      // Send invalid message
      wsClient.send('invalid json');

      await errorPromise;
      expect(wsClient.readyState).toBe(WebSocket.OPEN);
    });

    it('should handle server errors gracefully', async () => {
      const errorPromise = new Promise(resolve => {
        wsClient.on('error', resolve);
      });

      // Simulate server error
      jest.spyOn(NotificationService, 'createSystemNotification')
        .mockRejectedValue(new Error('Server error'));

      await NotificationService.createSystemNotification({
        userId: mockUser.id,
        title: 'Error Test',
        message: 'Should handle error'
      });

      await errorPromise;
      expect(wsClient.readyState).toBe(WebSocket.OPEN);
    });
  });
}); 
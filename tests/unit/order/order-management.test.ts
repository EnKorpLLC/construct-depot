import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { OrderManagementService } from '../../../src/services/order-management';
import { Order, OrderStatus } from '../../../src/types/order';

describe('Order Management Service', () => {
  let orderService: OrderManagementService;

  beforeEach(() => {
    orderService = new OrderManagementService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Order Creation', () => {
    it('should create new orders with valid data', async () => {
      const orderData = {
        userId: '123',
        items: [
          { productId: '1', quantity: 2, price: 100 },
          { productId: '2', quantity: 1, price: 50 }
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zip: '12345'
        }
      };

      const order = await orderService.createOrder(orderData);
      expect(order.id).toBeDefined();
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.totalAmount).toBe(250);
    });

    it('should validate order data before creation', async () => {
      const invalidOrder = {
        userId: '123',
        items: [] // Empty items array should be invalid
      };

      await expect(orderService.createOrder(invalidOrder))
        .rejects.toThrow('Order must contain at least one item');
    });
  });

  describe('Order Processing', () => {
    it('should process valid orders successfully', async () => {
      const order: Order = {
        id: '1',
        userId: '123',
        status: OrderStatus.PENDING,
        items: [{ productId: '1', quantity: 1, price: 100 }],
        totalAmount: 100
      };

      const result = await orderService.processOrder(order.id);
      expect(result.status).toBe(OrderStatus.PROCESSING);
    });

    it('should handle inventory checks during processing', async () => {
      const orderId = '1';
      const result = await orderService.checkInventory(orderId);
      expect(result.available).toBe(true);
    });
  });

  describe('Order Updates', () => {
    it('should update order status correctly', async () => {
      const orderId = '1';
      const newStatus = OrderStatus.SHIPPED;
      
      const updated = await orderService.updateOrderStatus(orderId, newStatus);
      expect(updated.status).toBe(OrderStatus.SHIPPED);
    });

    it('should validate status transitions', async () => {
      const orderId = '1';
      await expect(
        orderService.updateOrderStatus(orderId, OrderStatus.DELIVERED)
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('Bulk Operations', () => {
    it('should handle bulk order processing', async () => {
      const orderIds = ['1', '2', '3'];
      const results = await orderService.processBulkOrders(orderIds);
      expect(results.successCount).toBeGreaterThan(0);
    });
  });
});

export {}; 
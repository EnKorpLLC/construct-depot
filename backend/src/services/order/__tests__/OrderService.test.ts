import { OrderService } from '../OrderService';
import { DatabaseService } from '../../database/DatabaseService';
import { CreateOrderDTO, OrderStatus } from '../../../models/order/Order';
import { NotFoundError, ValidationError } from '../../../utils/errors';

jest.mock('../../database/DatabaseService');

describe('OrderService', () => {
  let orderService: OrderService;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      orders: {
        create: jest.fn(),
        findById: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as any;
    orderService = new OrderService(mockDb);
  });

  describe('createOrder', () => {
    const mockCreateOrderDTO: CreateOrderDTO = {
      userId: 'user-123',
      items: [
        { productId: 'product-123', quantity: 2, unitPrice: 10 }
      ]
    };

    it('should create an order successfully', async () => {
      const expectedOrder = {
        id: 'order-123',
        userId: mockCreateOrderDTO.userId,
        items: mockCreateOrderDTO.items.map(item => ({
          ...item,
          id: 'item-123',
          totalPrice: item.quantity * item.unitPrice
        })),
        status: OrderStatus.DRAFT,
        totalAmount: 20,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDb.orders.create.mockResolvedValue(expectedOrder);

      const result = await orderService.createOrder(mockCreateOrderDTO);
      expect(result).toEqual(expectedOrder);
      expect(mockDb.orders.create).toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('should return an order when found', async () => {
      const mockOrder = { id: 'order-123' };
      mockDb.orders.findById.mockResolvedValue(mockOrder);

      const result = await orderService.getOrder('order-123');
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundError when order does not exist', async () => {
      mockDb.orders.findById.mockResolvedValue(null);

      await expect(orderService.getOrder('non-existent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('updateOrder', () => {
    const mockOrder = {
      id: 'order-123',
      status: OrderStatus.DRAFT,
      items: []
    };

    beforeEach(() => {
      mockDb.orders.findById.mockResolvedValue(mockOrder);
    });

    it('should update order status successfully', async () => {
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.POOLING
      };
      mockDb.orders.update.mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrder('order-123', {
        status: OrderStatus.POOLING
      });

      expect(result).toEqual(updatedOrder);
    });

    it('should throw ValidationError for invalid status transition', async () => {
      await expect(
        orderService.updateOrder('order-123', { status: OrderStatus.COMPLETED })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteOrder', () => {
    it('should delete draft order successfully', async () => {
      mockDb.orders.findById.mockResolvedValue({
        id: 'order-123',
        status: OrderStatus.DRAFT
      });

      await orderService.deleteOrder('order-123');
      expect(mockDb.orders.delete).toHaveBeenCalledWith('order-123');
    });

    it('should throw ValidationError when deleting non-draft order', async () => {
      mockDb.orders.findById.mockResolvedValue({
        id: 'order-123',
        status: OrderStatus.PENDING
      });

      await expect(orderService.deleteOrder('order-123'))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('listOrders', () => {
    it('should return filtered orders', async () => {
      const mockOrders = [
        { id: 'order-1', status: OrderStatus.DRAFT },
        { id: 'order-2', status: OrderStatus.PENDING }
      ];
      mockDb.orders.find.mockResolvedValue(mockOrders);

      const result = await orderService.listOrders('user-123', OrderStatus.DRAFT);
      expect(result).toEqual(mockOrders);
      expect(mockDb.orders.find).toHaveBeenCalledWith({
        userId: 'user-123',
        status: OrderStatus.DRAFT
      });
    });
  });
}); 
import { PrismaClient } from '@prisma/client';
import OrderValidationService from '../orderValidation';
import { OrderStatus, UserRole, ValidationMessages } from '../types';

// Mock PrismaClient
jest.mock('@prisma/client');

describe('OrderValidationService', () => {
  let mockPrismaClient: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient() as jest.Mocked<PrismaClient>;
  });

  describe('validateOrderData', () => {
    it('should validate valid order data', async () => {
      const validOrderData = {
        items: [{
          productId: '123e4567-e89b-12d3-a456-426614174000',
          quantity: 5,
          unitPrice: 10.99
        }],
        shippingAddress: '123 Main St',
        shippingCity: 'Anytown',
        shippingState: 'CA',
        shippingZip: '12345',
        shippingCountry: 'USA',
        status: OrderStatus.DRAFT
      };

      const result = await OrderValidationService.validateOrderData(validOrderData);
      expect(result).toEqual(validOrderData);
    });

    it('should reject invalid order data', async () => {
      const invalidOrderData = {
        items: [{
          productId: 'invalid-uuid',
          quantity: -1,
          unitPrice: 0
        }],
        shippingAddress: '',
        shippingCity: '',
        shippingState: 'CAL',
        shippingZip: 'invalid',
        shippingCountry: '',
        status: 'INVALID_STATUS'
      };

      await expect(OrderValidationService.validateOrderData(invalidOrderData))
        .rejects.toThrow(ValidationMessages.INVALID_ORDER_DATA);
    });
  });

  describe('validateStatusTransition', () => {
    const mockContext = {
      userId: 'user123',
      userRole: UserRole.CUSTOMER
    };

    it('should allow valid status transition for authorized user', async () => {
      const mockOrder = {
        id: 'order123',
        status: OrderStatus.DRAFT,
        items: []
      };

      mockPrismaClient.order.findUnique.mockResolvedValue(mockOrder as any);

      const result = await OrderValidationService.validateStatusTransition(
        'order123',
        OrderStatus.PENDING,
        mockContext
      );

      expect(result).toBe(true);
    });

    it('should reject invalid status transition', async () => {
      const mockOrder = {
        id: 'order123',
        status: OrderStatus.DRAFT,
        items: []
      };

      mockPrismaClient.order.findUnique.mockResolvedValue(mockOrder as any);

      await expect(OrderValidationService.validateStatusTransition(
        'order123',
        OrderStatus.SHIPPED,
        mockContext
      )).rejects.toThrow(ValidationMessages.INVALID_STATUS_TRANSITION);
    });

    it('should reject unauthorized status transition', async () => {
      const mockOrder = {
        id: 'order123',
        status: OrderStatus.PENDING,
        items: []
      };

      mockPrismaClient.order.findUnique.mockResolvedValue(mockOrder as any);

      await expect(OrderValidationService.validateStatusTransition(
        'order123',
        OrderStatus.PROCESSING,
        mockContext
      )).rejects.toThrow(ValidationMessages.INSUFFICIENT_PERMISSIONS);
    });
  });

  describe('validatePoolRequirements', () => {
    it('should validate pool requirements are met', async () => {
      const mockOrder = {
        id: 'order123',
        pooledOrderId: 'pool123',
        status: OrderStatus.PENDING,
        items: [{ quantity: 5 }]
      };

      const mockPooledOrder = {
        id: 'pool123',
        currentQuantity: 15,
        product: {
          minOrderQuantity: 20
        }
      };

      mockPrismaClient.pooledOrder.findUnique.mockResolvedValue(mockPooledOrder as any);

      const result = await OrderValidationService.validateStatusTransition(
        'order123',
        OrderStatus.POOLING,
        { userId: 'user123', userRole: UserRole.SUPPLIER }
      );

      expect(result).toBe(true);
    });

    it('should reject when pool requirements are not met', async () => {
      const mockOrder = {
        id: 'order123',
        pooledOrderId: 'pool123',
        status: OrderStatus.PENDING,
        items: [{ quantity: 5 }]
      };

      const mockPooledOrder = {
        id: 'pool123',
        currentQuantity: 5,
        product: {
          minOrderQuantity: 20
        }
      };

      mockPrismaClient.pooledOrder.findUnique.mockResolvedValue(mockPooledOrder as any);

      await expect(OrderValidationService.validateStatusTransition(
        'order123',
        OrderStatus.POOLING,
        { userId: 'user123', userRole: UserRole.SUPPLIER }
      )).rejects.toThrow(ValidationMessages.POOL_REQUIREMENTS_NOT_MET);
    });
  });
}); 
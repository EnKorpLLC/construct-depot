import { ValidationError } from '@/lib/errors';
import { OrderData, PoolData } from '@/types/order';

export class EnhancedValidationService {
  validateOrderData(data: OrderData): void {
    if (!data.userId) {
      throw new ValidationError('User ID is required');
    }

    if (!data.supplierId) {
      throw new ValidationError('Supplier ID is required');
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new ValidationError('Order must contain at least one item');
    }

    data.items.forEach((item, index) => {
      if (!item.productId) {
        throw new ValidationError(`Product ID is required for item at index ${index}`);
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new ValidationError(`Invalid quantity for item at index ${index}`);
      }

      if (typeof item.unitPrice !== 'number' || item.unitPrice <= 0) {
        throw new ValidationError(`Invalid unit price for item at index ${index}`);
      }
    });
  }

  validatePoolData(data: PoolData): void {
    if (!data.productId) {
      throw new ValidationError('Product ID is required');
    }

    if (!data.supplierId) {
      throw new ValidationError('Supplier ID is required');
    }

    if (!Number.isInteger(data.minQuantity) || data.minQuantity <= 0) {
      throw new ValidationError('Minimum quantity must be a positive integer');
    }

    if (typeof data.pricePerUnit !== 'number' || data.pricePerUnit <= 0) {
      throw new ValidationError('Price per unit must be a positive number');
    }

    if (!(data.expiryDate instanceof Date) || data.expiryDate <= new Date()) {
      throw new ValidationError('Expiry date must be in the future');
    }
  }
} 
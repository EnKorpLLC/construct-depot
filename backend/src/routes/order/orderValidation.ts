import { z } from 'zod';
import { OrderStatus } from '../../models/order/Order';

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export const createOrderSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    items: z.array(orderItemSchema).min(1),
    metadata: z.record(z.any()).optional(),
  }),
});

export const updateOrderSchema = z.object({
  body: z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    items: z.array(orderItemSchema).min(1).optional(),
    metadata: z.record(z.any()).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    status: z.nativeEnum(OrderStatus).optional(),
  }),
}); 
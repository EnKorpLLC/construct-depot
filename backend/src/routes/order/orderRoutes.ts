import { Router } from 'express';
import { OrderController } from '../../controllers/order/OrderController';
import { authenticateUser } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { createOrderSchema, updateOrderSchema } from './orderValidation';

export function createOrderRouter(orderController: OrderController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authenticateUser);

  // GET /orders
  router.get('/', async (req, res) => {
    await orderController.listOrders(req, res);
  });

  // GET /orders/:id
  router.get('/:id', async (req, res) => {
    await orderController.getOrder(req, res);
  });

  // POST /orders
  router.post('/',
    validateRequest(createOrderSchema),
    async (req, res) => {
      await orderController.createOrder(req, res);
    }
  );

  // PUT /orders/:id
  router.put('/:id',
    validateRequest(updateOrderSchema),
    async (req, res) => {
      await orderController.updateOrder(req, res);
    }
  );

  // DELETE /orders/:id
  router.delete('/:id', async (req, res) => {
    await orderController.deleteOrder(req, res);
  });

  return router;
} 
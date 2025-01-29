import { Request, Response } from 'express';
import { OrderService } from '../../services/order/OrderService';
import { CreateOrderDTO, UpdateOrderDTO, OrderStatus } from '../../models/order/Order';
import { ValidationError } from '../../utils/errors';

export class OrderController {
  private orderService: OrderService;

  constructor(orderService: OrderService) {
    this.orderService = orderService;
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const dto = req.body as CreateOrderDTO;
      const order = await this.orderService.createOrder(dto);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const order = await this.orderService.getOrder(id);
      res.json(order);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto = req.body as UpdateOrderDTO;
      const order = await this.orderService.updateOrder(id, dto);
      res.json(order);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.orderService.deleteOrder(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async listOrders(req: Request, res: Response): Promise<void> {
    try {
      const { userId, status } = req.query;
      const orders = await this.orderService.listOrders(
        userId as string,
        status as OrderStatus
      );
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 
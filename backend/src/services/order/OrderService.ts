import { Order, CreateOrderDTO, UpdateOrderDTO, OrderStatus } from '../../models/order/Order';
import { DatabaseService } from '../database/DatabaseService';
import { NotFoundError, ValidationError } from '../../utils/errors';

export class OrderService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    // Calculate total amount and validate items
    const totalAmount = dto.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0);

    const order: Omit<Order, 'id'> = {
      userId: dto.userId,
      items: dto.items.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        totalPrice: item.quantity * item.unitPrice
      })),
      status: OrderStatus.DRAFT,
      totalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: dto.metadata
    };

    return await this.db.orders.create(order);
  }

  async getOrder(id: string): Promise<Order> {
    const order = await this.db.orders.findById(id);
    if (!order) {
      throw new NotFoundError(`Order with id ${id} not found`);
    }
    return order;
  }

  async updateOrder(id: string, dto: UpdateOrderDTO): Promise<Order> {
    const order = await this.getOrder(id);
    
    // Update items if provided
    if (dto.items) {
      const totalAmount = dto.items.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0);
      
      order.items = dto.items.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        totalPrice: item.quantity * item.unitPrice
      }));
      order.totalAmount = totalAmount;
    }

    // Update status if provided
    if (dto.status) {
      this.validateStatusTransition(order.status, dto.status);
      order.status = dto.status;
      
      // Set completion or cancellation date
      if (dto.status === OrderStatus.COMPLETED) {
        order.completedAt = new Date();
      } else if (dto.status === OrderStatus.CANCELLED) {
        order.cancelledAt = new Date();
      }
    }

    order.updatedAt = new Date();
    order.metadata = { ...order.metadata, ...dto.metadata };

    return await this.db.orders.update(id, order);
  }

  async deleteOrder(id: string): Promise<void> {
    const order = await this.getOrder(id);
    if (order.status !== OrderStatus.DRAFT) {
      throw new ValidationError('Only draft orders can be deleted');
    }
    await this.db.orders.delete(id);
  }

  async listOrders(userId?: string, status?: OrderStatus): Promise<Order[]> {
    const filters: Record<string, any> = {};
    if (userId) filters.userId = userId;
    if (status) filters.status = status;
    return await this.db.orders.find(filters);
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.DRAFT]: [OrderStatus.POOLING, OrderStatus.CANCELLED],
      [OrderStatus.POOLING]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: []
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
} 
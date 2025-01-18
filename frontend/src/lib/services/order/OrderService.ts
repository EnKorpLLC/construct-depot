import { Order, CreateOrderDTO, UpdateOrderDTO, OrderStatus } from '../../../types/order';
import { ApiService } from '../ApiService';
import { WebSocketService } from '../WebSocketService';

export class OrderService {
  private static instance: OrderService;
  private api: ApiService;
  private ws: WebSocketService;

  private constructor() {
    this.api = ApiService.getInstance();
    this.ws = WebSocketService.getInstance();
    this.setupWebSocket();
  }

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  private setupWebSocket() {
    this.ws.subscribe('order-updates', (data: any) => {
      // Notify subscribers about order updates
      this.notifyOrderUpdate(data);
    });
  }

  private notifyOrderUpdate(order: Order) {
    // Implement pub/sub pattern for real-time updates
    document.dispatchEvent(new CustomEvent('order-updated', { 
      detail: order 
    }));
  }

  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    const response = await this.api.post<Order>('/api/orders', dto);
    this.notifyOrderUpdate(response);
    return response;
  }

  async getOrder(id: string): Promise<Order> {
    return await this.api.get<Order>(`/api/orders/${id}`);
  }

  async updateOrder(id: string, dto: UpdateOrderDTO): Promise<Order> {
    const response = await this.api.put<Order>(`/api/orders/${id}`, dto);
    this.notifyOrderUpdate(response);
    return response;
  }

  async deleteOrder(id: string): Promise<void> {
    await this.api.delete(`/api/orders/${id}`);
  }

  async listOrders(userId?: string, status?: OrderStatus): Promise<Order[]> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (status) params.append('status', status);
    
    return await this.api.get<Order[]>(`/api/orders?${params.toString()}`);
  }

  onOrderUpdate(callback: (order: Order) => void): () => void {
    const handler = (event: CustomEvent<Order>) => callback(event.detail);
    document.addEventListener('order-updated', handler as EventListener);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('order-updated', handler as EventListener);
    };
  }
} 
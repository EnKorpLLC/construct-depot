import { prisma } from '@/lib/db';
import { Order, Project } from '@prisma/client';

export interface DashboardStats {
  totalOrders: number;
  activeProjects: number;
  totalSpent: number;
  pendingDeliveries: number;
}

export const CustomerDashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [totalOrders, activeProjects, totalSpent, pendingDeliveries] = await Promise.all([
      prisma.order.count({ where: { userId: 'current-user' } }),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.order.aggregate({
        where: { userId: 'current-user' },
        _sum: { totalAmount: true }
      }),
      prisma.order.count({ where: { status: 'PENDING' } })
    ]);

    return {
      totalOrders,
      activeProjects,
      totalSpent: totalSpent._sum.totalAmount?.toNumber() || 0,
      pendingDeliveries
    };
  },

  async getProjects(): Promise<Project[]> {
    return prisma.project.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });
  },

  async getRecentOrders(): Promise<Order[]> {
    return prisma.order.findMany({
      where: { userId: 'current-user' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
  },

  async getBudgetOverview() {
    // Implement budget overview logic
    return {
      totalBudget: 100000,
      spent: 45000,
      remaining: 55000,
      categories: [
        { name: 'Materials', allocated: 50000, spent: 25000 },
        { name: 'Labor', allocated: 30000, spent: 15000 },
        { name: 'Equipment', allocated: 20000, spent: 5000 }
      ]
    };
  },

  async getTimelineEvents() {
    // Implement timeline events logic
    return [
      { id: '1', title: 'Order Placed', date: new Date(), type: 'ORDER' },
      { id: '2', title: 'Project Started', date: new Date(), type: 'PROJECT' }
    ];
  },

  async getRecentMessages() {
    // Implement messages logic
    return [
      { id: '1', text: 'Your order has been confirmed', date: new Date() },
      { id: '2', text: 'New quote available', date: new Date() }
    ];
  },

  async getRecentNotifications() {
    // Implement notifications logic
    return [
      { id: '1', message: 'Order status updated', read: false },
      { id: '2', message: 'New message from supplier', read: true }
    ];
  }
};

export default CustomerDashboardService; 
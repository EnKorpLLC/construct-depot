import { PrismaClient } from '@prisma/client';
import { DatabaseError } from '../../utils/errors';
import { 
  DatabaseOrder, 
  CreateOrderData, 
  UpdateOrderData, 
  OrderFilters 
} from './types';

export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  get orders() {
    return {
      create: async (data: CreateOrderData): Promise<DatabaseOrder> => {
        try {
          return await this.prisma.order.create({
            data: {
              userId: data.userId,
              totalAmount: data.items.reduce((sum, item) => 
                sum + (item.quantity * item.unitPrice), 0),
              items: {
                create: data.items
              },
              metadata: data.metadata
            },
            include: {
              items: {
                include: {
                  product: true
                }
              },
              user: true
            }
          }) as DatabaseOrder;
        } catch (error) {
          throw new DatabaseError(`Failed to create order: ${error.message}`);
        }
      },

      findById: async (id: string): Promise<DatabaseOrder | null> => {
        try {
          return await this.prisma.order.findUnique({
            where: { id },
            include: {
              items: {
                include: {
                  product: true
                }
              },
              user: true
            }
          }) as DatabaseOrder | null;
        } catch (error) {
          throw new DatabaseError(`Failed to find order: ${error.message}`);
        }
      },

      find: async (filters: OrderFilters): Promise<DatabaseOrder[]> => {
        try {
          return await this.prisma.order.findMany({
            where: filters,
            include: {
              items: {
                include: {
                  product: true
                }
              },
              user: true
            }
          }) as DatabaseOrder[];
        } catch (error) {
          throw new DatabaseError(`Failed to find orders: ${error.message}`);
        }
      },

      update: async (id: string, data: UpdateOrderData): Promise<DatabaseOrder> => {
        try {
          const updateData: any = { ...data };
          if (data.items) {
            updateData.items = {
              deleteMany: {},
              create: data.items
            };
            updateData.totalAmount = data.items.reduce((sum, item) => 
              sum + (item.quantity * item.unitPrice), 0);
          }

          return await this.prisma.order.update({
            where: { id },
            data: updateData,
            include: {
              items: {
                include: {
                  product: true
                }
              },
              user: true
            }
          }) as DatabaseOrder;
        } catch (error) {
          throw new DatabaseError(`Failed to update order: ${error.message}`);
        }
      },

      delete: async (id: string): Promise<void> => {
        try {
          await this.prisma.order.delete({
            where: { id }
          });
        } catch (error) {
          throw new DatabaseError(`Failed to delete order: ${error.message}`);
        }
      }
    };
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
} 
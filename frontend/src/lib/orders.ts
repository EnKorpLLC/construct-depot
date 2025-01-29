import { prisma } from '@/lib/prisma';
import { OrderStatus, PooledOrderStatus } from '@prisma/client';

export class OrderService {
  // Get orders for a user (customer or supplier)
  static async getUserOrders(
    userId: string,
    role: 'CUSTOMER' | 'SUPPLIER',
    status?: string,
    limit: number = 10,
    offset: number = 0
  ) {
    const where = {
      ...(role === 'SUPPLIER' ? { supplierId: userId } : { userId }),
      ...(status ? { status: status as OrderStatus } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  // Get pooled orders for a supplier
  static async getSupplierPooledOrders(supplierId: string) {
    return prisma.pooledOrder.findMany({
      where: {
          supplierId,
      },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Update order status
  static async updateOrderStatus(orderId: string, status: OrderStatus, supplierId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        supplierId,
      },
    });

    if (!order) {
      throw new Error('Order not found or unauthorized');
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  // Update pooled order status
  static async updatePooledOrderStatus(pooledOrderId: string, status: PooledOrderStatus) {
    const pooledOrder = await prisma.pooledOrder.findUnique({
        where: { id: pooledOrderId },
        include: {
          orders: true,
        },
      });

      if (!pooledOrder) {
        throw new Error('Pooled order not found');
      }

    // Start a transaction to update both pooled order and individual orders
    return prisma.$transaction(async (tx) => {
      // Update pooled order status
      const updatedPooledOrder = await tx.pooledOrder.update({
        where: { id: pooledOrderId },
        data: { status },
      });

      // Update status of all associated orders based on pooled order status
      const orderStatus = status === 'COMPLETED' ? 'PROCESSING' : 
                         status === 'CANCELLED' ? 'CANCELLED' : 
                         'CONFIRMED';

      await tx.order.updateMany({
        where: { pooledOrderId },
        data: { status: orderStatus },
      });

      return updatedPooledOrder;
    });
  }

  // Create a new order and handle pooling if necessary
  static async createOrder(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    shippingAddress: string,
    subtotal: number,
    taxAmount: number,
    isExempt: boolean,
    exemptionNumber?: string
  ) {
    // Get product details and supplier info
    const products = await prisma.product.findMany({
      where: {
        id: { in: items.map(item => item.productId) },
      },
    });

    // Group items by supplier
    const itemsBySupplier = items.reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      
      const supplierId = product.supplierId;
      if (!acc[supplierId]) {
        acc[supplierId] = [];
      }
      acc[supplierId].push({ ...item, product });
      return acc;
    }, {} as Record<string, Array<typeof items[0] & { product: typeof products[0] }>>);

    // Create orders for each supplier
    const orders = await Promise.all(
      Object.entries(itemsBySupplier).map(async ([supplierId, supplierItems]) => {
        const supplierSubtotal = supplierItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );

        // Calculate supplier's portion of tax
        const supplierTaxAmount = (supplierSubtotal / subtotal) * taxAmount;

        const order = await prisma.order.create({
          data: {
            userId,
            supplierId,
            status: 'PENDING',
            shippingAddress,
            subtotal: supplierSubtotal,
            taxAmount: supplierTaxAmount,
            isExempt,
            exemptionNumber,
            items: {
              create: supplierItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtTime: item.product.price,
              })),
            },
          },
          include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

        // Check if order needs to be pooled
        const needsPooling = supplierItems.some(
          item => item.quantity < item.product.minOrderQuantity
        );

        if (needsPooling) {
          await this.handleOrderPooling(order);
        }

        return order;
      })
    );

    return orders;
  }

  // Handle order pooling logic
  private static async handleOrderPooling(order: any) {
    // Find or create a pooled order for the supplier
    let pooledOrder = await prisma.pooledOrder.findFirst({
      where: {
        supplierId: order.supplierId,
        status: 'PROCESSING',
      },
    });

    if (!pooledOrder) {
      pooledOrder = await prisma.pooledOrder.create({
        data: {
          supplierId: order.supplierId,
          status: 'PROCESSING',
        },
      });
    }

    // Associate the order with the pooled order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        pooledOrderId: pooledOrder.id,
        status: 'PENDING',
      },
    });

    // Check if minimum quantities are met
    const pooledOrderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          pooledOrderId: pooledOrder.id,
        },
      },
          include: {
        product: true,
      },
    });

    // Group items by product
    const itemsByProduct = pooledOrderItems.reduce((acc, item) => {
      if (!acc[item.productId]) {
        acc[item.productId] = {
          quantity: 0,
          minOrderQuantity: item.product.minOrderQuantity,
        };
      }
      acc[item.productId].quantity += item.quantity;
      return acc;
    }, {} as Record<string, { quantity: number; minOrderQuantity: number }>);

    // Check if all products meet minimum order quantities
    const allMinimumsMet = Object.values(itemsByProduct).every(
      item => item.quantity >= item.minOrderQuantity
    );

    if (allMinimumsMet) {
      // Update pooled order status and notify supplier
      await prisma.pooledOrder.update({
        where: { id: pooledOrder.id },
        data: { status: 'COMPLETED' },
      });

      // Update all associated orders
      await prisma.order.updateMany({
        where: { pooledOrderId: pooledOrder.id },
        data: { status: 'PROCESSING' },
      });
    }
  }
} 
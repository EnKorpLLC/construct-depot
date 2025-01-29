import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const CACHE_TTL = 300; // 5 minutes in seconds

export async function GET(req: NextRequest) {
  console.log(`Received request for customers analytics: ${req.method} ${req.url}`);
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = new URL(req.url).searchParams;
    const timeframe = searchParams.get('timeframe') || 'month';

    // Try to get from cache first
    const cacheKey = `customers:${timeframe}:${session.user.id}`;
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get customer metrics
    const [
      totalCustomers,
      newCustomers,
      customerSegments,
      topCategories,
      repeatCustomerMetrics,
    ] = await Promise.all([
      // Total customers with orders
      prisma.user.count({
        where: {
          orders: {
            some: {
              createdAt: {
                gte: startDate,
              },
            },
          },
        },
      }),

      // New customers (first order in period)
      prisma.user.count({
        where: {
          orders: {
            some: {
              createdAt: {
                gte: startDate,
              },
            },
            none: {
              createdAt: {
                lt: startDate,
              },
            },
          },
        },
      }),

      // Customer segments by order frequency
      prisma.$queryRaw<Array<{ name: string; value: number }>>`
        WITH CustomerOrders AS (
          SELECT 
            u.id,
            COUNT(o.id) as order_count
          FROM "User" u
          JOIN "Order" o ON o.user_id = u.id
          WHERE o.created_at >= ${startDate}
          GROUP BY u.id
        )
        SELECT
          CASE 
            WHEN order_count = 1 THEN 'One-time'
            WHEN order_count = 2 THEN 'Returning'
            WHEN order_count <= 5 THEN 'Regular'
            ELSE 'Loyal'
          END as name,
          COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as value
        FROM CustomerOrders
        GROUP BY 
          CASE 
            WHEN order_count = 1 THEN 'One-time'
            WHEN order_count = 2 THEN 'Returning'
            WHEN order_count <= 5 THEN 'Regular'
            ELSE 'Loyal'
          END
        ORDER BY value DESC
      `,

      // Top categories by revenue and orders
      prisma.$queryRaw<Array<{ category: string; orders: number; revenue: number }>>`
        WITH OrderItems AS (
          SELECT 
            p.categories[1] as category,
            COUNT(DISTINCT o.id) as orders,
            SUM(oi.total_price) as revenue
          FROM "Order" o
          JOIN "OrderItem" oi ON o.id = oi.order_id
          JOIN "Product" p ON oi.product_id = p.id
          WHERE o.created_at >= ${startDate}
          GROUP BY p.categories[1]
        )
        SELECT 
          category,
          orders,
          revenue
        FROM OrderItems
        WHERE category IS NOT NULL
        ORDER BY revenue DESC
        LIMIT 5
      `,

      // Repeat customer metrics
      prisma.$queryRaw<Array<{ total_customers: number; repeat_customers: number; avg_orders: number }>>`
        WITH CustomerMetrics AS (
          SELECT 
            COUNT(DISTINCT user_id) as total_customers,
            COUNT(DISTINCT CASE WHEN orders > 1 THEN user_id END) as repeat_customers,
            AVG(orders) as avg_orders
          FROM (
            SELECT 
              user_id,
              COUNT(*) as orders
            FROM "Order"
            WHERE created_at >= ${startDate}
            GROUP BY user_id
          ) user_orders
        )
        SELECT 
          total_customers,
          repeat_customers,
          ROUND(avg_orders::numeric, 2) as avg_orders
        FROM CustomerMetrics
      `,
    ]);

    // Calculate repeat rate
    const metrics = repeatCustomerMetrics[0];
    const repeatRate = metrics.total_customers > 0
      ? (metrics.repeat_customers / metrics.total_customers) * 100
      : 0;

    const response = {
      totalCustomers,
      newCustomers,
      repeatRate: Math.round(repeatRate * 100) / 100,
      averageOrdersPerCustomer: Number(metrics.avg_orders),
      customerSegments: customerSegments.map(segment => ({
        name: segment.name,
        value: Math.round(Number(segment.value) * 100) / 100,
      })),
      topCategories: topCategories.map(category => ({
        category: category.category || 'Uncategorized',
        orders: Number(category.orders),
        revenue: Number(category.revenue),
      })),
    };

    // Cache the response
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing customers analytics request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
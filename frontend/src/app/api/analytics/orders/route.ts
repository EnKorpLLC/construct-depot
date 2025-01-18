import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { redis } from '@/lib/redis';

const CACHE_TTL = 300; // 5 minutes in seconds

export async function GET(req: NextRequest) {
  console.log(`Received request for orders analytics: ${req.method} ${req.url}`);
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
    const cacheKey = `orders:${timeframe}:${session.user.id}`;
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

    // Get order metrics
    const [totalOrders, pendingOrders, completedOrders, orderTrends] = await Promise.all([
      // Total orders count
      prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),

      // Pending orders count
      prisma.order.count({
        where: {
          status: {
            in: ['PENDING', 'PROCESSING', 'CONFIRMED'],
          },
          createdAt: {
            gte: startDate,
          },
        },
      }),

      // Completed orders count
      prisma.order.count({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: startDate,
          },
        },
      }),

      // Daily order trends
      prisma.$queryRaw<Array<{ date: Date; orders: number }>>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders
        FROM "Order"
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    // Format trends data
    const formattedTrends = orderTrends.map(trend => ({
      date: trend.date.toISOString(),
      orders: Number(trend.orders),
    }));

    const response = {
      totalOrders,
      pendingOrders,
      completedOrders,
      orderTrends: formattedTrends,
    };

    // Cache the response
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing orders analytics request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
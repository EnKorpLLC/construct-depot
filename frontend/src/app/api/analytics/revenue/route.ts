import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const CACHE_TTL = 300; // 5 minutes in seconds

export async function GET(req: NextRequest) {
  console.log(`Received request for revenue analytics: ${req.method} ${req.url}`);
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
    const cacheKey = `revenue:${timeframe}:${session.user.id}`;
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    // Calculate date ranges
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();

    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate.setMonth(now.getMonth() - 2);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        break;
    }

    // Get revenue metrics
    const [currentPeriod, previousPeriod, averageOrderValue, revenueTrends] = await Promise.all([
      // Current period revenue
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startDate,
          },
          status: {
            not: 'CANCELLED',
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Previous period revenue (for growth calculation)
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate,
          },
          status: {
            not: 'CANCELLED',
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Average order value
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startDate,
          },
          status: {
            not: 'CANCELLED',
          },
        },
        _avg: {
          totalAmount: true,
        },
      }),

      // Daily revenue trends
      prisma.$queryRaw<Array<{ date: Date; revenue: number; averageOrder: number }>>`
        SELECT 
          DATE(created_at) as date,
          SUM(total_amount) as revenue,
          AVG(total_amount) as average_order
        FROM "Order"
        WHERE created_at >= ${startDate}
        AND status != 'CANCELLED'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    // Calculate revenue growth
    const currentRevenue = currentPeriod._sum.totalAmount || 0;
    const previousRevenue = previousPeriod._sum.totalAmount || 0;
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Format trends data
    const formattedTrends = revenueTrends.map(trend => ({
      date: trend.date.toISOString(),
      revenue: Number(trend.revenue),
      averageOrder: Number(trend.average_order),
    }));

    const response = {
      totalRevenue: currentRevenue,
      averageOrderValue: averageOrderValue._avg.totalAmount || 0,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      revenueTrends: formattedTrends,
    };

    // Cache the response
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing revenue analytics request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
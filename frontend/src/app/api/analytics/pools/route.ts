import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const CACHE_TTL = 300; // 5 minutes in seconds

export async function GET(req: NextRequest) {
  console.log(`Received request for pools analytics: ${req.method} ${req.url}`);
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
    const cacheKey = `pools:${timeframe}:${session.user.id}`;
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

    // Get pool metrics
    const [totalPools, activePools, completedPools, averageCompletionTime, completionRates] = await Promise.all([
      // Total pools count
      prisma.pooledOrder.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),

      // Active pools count
      prisma.pooledOrder.count({
        where: {
          status: {
            in: ['OPEN', 'LOCKED'],
          },
          createdAt: {
            gte: startDate,
          },
        },
      }),

      // Completed pools count
      prisma.pooledOrder.count({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
          },
        },
      }),

      // Average completion time (in days)
      prisma.$queryRaw<Array<{ avg_days: number }>>`
        SELECT AVG(EXTRACT(EPOCH FROM (end_date - start_date)) / 86400) as avg_days
        FROM "PooledOrder"
        WHERE status = 'COMPLETED'
        AND created_at >= ${startDate}
      `,

      // Completion rates by product category
      prisma.$queryRaw<Array<{ category: string; rate: number }>>`
        WITH CategoryPools AS (
          SELECT 
            p.categories[1] as category,
            COUNT(*) as total_pools,
            COUNT(CASE WHEN po.status = 'COMPLETED' THEN 1 END) as completed_pools
          FROM "PooledOrder" po
          JOIN "Product" p ON po.product_id = p.id
          WHERE po.created_at >= ${startDate}
          GROUP BY p.categories[1]
        )
        SELECT 
          category,
          ROUND((completed_pools::float / total_pools::float) * 100, 2) as rate
        FROM CategoryPools
        WHERE total_pools > 0
        ORDER BY rate DESC
        LIMIT 5
      `,
    ]);

    const response = {
      totalPools,
      activePools,
      completedPools,
      averageCompletionTime: Math.round(averageCompletionTime[0]?.avg_days || 0),
      completionRates: completionRates.map(rate => ({
        category: rate.category || 'Uncategorized',
        rate: Number(rate.rate),
      })),
    };

    // Cache the response
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing pools analytics request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
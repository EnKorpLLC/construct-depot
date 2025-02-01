import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface OrderTrend {
  date: Date;
  orders: bigint;
}

export async function GET(req: NextRequest) {
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
      default:
        throw new Error('Invalid timeframe');
    }

    // Get order metrics
    const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.order.count({
        where: {
          status: 'PENDING',
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.order.count({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
          },
        },
      }),
    ]);

    // Get daily order trends
    const orderTrends = await prisma.$queryRaw<OrderTrend[]>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders
      FROM "Order"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const response = {
      totalOrders,
      pendingOrders,
      completedOrders,
      orderTrends: orderTrends.map((trend) => ({
        date: trend.date.toISOString(),
        orders: Number(trend.orders),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing orders analytics request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
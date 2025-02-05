import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

interface OrderTrend {
  date: Date;
  orders: bigint;
}

// Add export config to mark as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('timeRange') || 'monthly';
  const role = session.user.role;

  try {
    let orders;
    const currentDate = new Date();
    const startDate = new Date();

    // Set date range based on selected time range
    switch (timeRange) {
      case 'daily':
        startDate.setDate(currentDate.getDate() - 7);
        break;
      case 'weekly':
        startDate.setDate(currentDate.getDate() - 28);
        break;
      case 'monthly':
        startDate.setMonth(currentDate.getMonth() - 6);
        break;
      case 'yearly':
        startDate.setFullYear(currentDate.getFullYear() - 1);
        break;
    }

    // Query based on user role
    switch (role) {
      case Role.supplier:
        orders = await prisma.order.findMany({
          where: {
            product: {
              supplierId: session.user.id,
            },
            createdAt: {
              gte: startDate,
            },
          },
          include: {
            product: true,
          },
        });
        break;
      case Role.general_contractor:
      case Role.subcontractor:
        orders = await prisma.order.findMany({
          where: {
            userId: session.user.id,
            createdAt: {
              gte: startDate,
            },
          },
          include: {
            product: true,
          },
        });
        break;
      case Role.super_admin:
      case Role.admin:
        orders = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: startDate,
            },
          },
          include: {
            product: true,
          },
        });
        break;
      default:
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // Process orders into time-based groups
    const ordersByTime = new Map();
    const revenueByTime = new Map();

    orders.forEach(order => {
      let timeKey;
      const date = new Date(order.createdAt);

      switch (timeRange) {
        case 'daily':
          timeKey = date.toLocaleDateString();
          break;
        case 'weekly':
          const week = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          timeKey = `Week ${week + 1}`;
          break;
        case 'monthly':
          timeKey = date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
          break;
        case 'yearly':
          timeKey = date.getFullYear().toString();
          break;
      }

      ordersByTime.set(timeKey, (ordersByTime.get(timeKey) || 0) + 1);
      revenueByTime.set(timeKey, (revenueByTime.get(timeKey) || 0) + order.product.price);
    });

    // Convert to array format for charts
    const ordersData = Array.from(ordersByTime.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    const revenueData = Array.from(revenueByTime.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));

    return NextResponse.json({
      orders: ordersData,
      revenue: revenueData,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
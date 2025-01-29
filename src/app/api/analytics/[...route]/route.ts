import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { analyticsService } from '@/services/analytics/AnalyticsService';
import { TimeFrame, ReportConfig } from '@/services/analytics/types';
import { z } from 'zod';

const timeframeSchema = z.enum(['week', 'month', 'year']);

const reportConfigSchema = z.object({
  name: z.string(),
  type: z.enum(['PERFORMANCE', 'REVENUE', 'CUSTOMER', 'CUSTOM']),
  metrics: z.array(z.string()),
  dimensions: z.array(z.string()),
  filters: z.object({
    from: z.string(),
    to: z.string()
  }).catchall(z.any()),
  format: z.enum(['JSON', 'CSV', 'PDF'])
});

// GET /api/analytics/orders
export async function GET(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [route] = params.route;
  const searchParams = request.nextUrl.searchParams;
  const timeframe = searchParams.get('timeframe') || 'month';

  try {
    timeframeSchema.parse(timeframe);

    switch (route) {
      case 'orders':
        const orderMetrics = await analyticsService.getOrderMetrics(timeframe as TimeFrame);
        return NextResponse.json(orderMetrics);

      case 'customers':
        const customerMetrics = await analyticsService.getCustomerMetrics(timeframe as TimeFrame);
        return NextResponse.json(customerMetrics);

      case 'revenue':
        const revenueMetrics = await analyticsService.getRevenueMetrics(timeframe as TimeFrame);
        return NextResponse.json(revenueMetrics);

      case 'reports':
        const reportId = searchParams.get('reportId');
        if (!reportId) {
          return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
        }
        const report = await analyticsService.getReportStatus(reportId);
        return NextResponse.json(report);

      default:
        return NextResponse.json({ error: 'Invalid route' }, { status: 404 });
    }
  } catch (error) {
    console.error('Analytics API Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/analytics/reports
export async function POST(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [route] = params.route;
  if (route !== 'reports') {
    return NextResponse.json({ error: 'Invalid route' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const config = reportConfigSchema.parse(body);
    const reportId = await analyticsService.generateReport(config);
    
    return NextResponse.json({
      reportId,
      status: 'PROCESSING',
      message: 'Report generation started'
    });
  } catch (error) {
    console.error('Report Generation Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid report configuration' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
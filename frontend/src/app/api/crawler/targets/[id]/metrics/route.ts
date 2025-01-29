import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { CrawlerService } from '@/services/crawler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if target exists and belongs to user
    const target = await prisma.crawlTarget.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!target) {
      return NextResponse.json(
        { error: 'Target not found' },
        { status: 404 }
      );
    }

    // Get metrics
    const crawlerService = CrawlerService.getInstance();
    const metrics = crawlerService.getMetrics(params.id);

    // Get recent results
    const recentResults = await prisma.crawlResult.findMany({
      where: { targetId: params.id },
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        timestamp: true,
        success: true,
        duration: true,
        statusCode: true,
        error: true
      }
    });

    return NextResponse.json({
      metrics,
      recentResults,
      target: {
        id: target.id,
        url: target.url,
        isActive: target.isActive,
        lastCrawled: target.lastCrawled
      }
    });
  } catch (error) {
    console.error('[API] Get metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
} 
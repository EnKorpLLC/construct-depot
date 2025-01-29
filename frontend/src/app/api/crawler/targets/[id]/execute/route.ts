import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { CrawlerService } from '@/services/crawler';

export async function POST(
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

    // Check if target is active
    if (!target.isActive) {
      return NextResponse.json(
        { error: 'Target is not active' },
        { status: 400 }
      );
    }

    // Execute crawl
    const crawlerService = CrawlerService.getInstance();
    const result = await crawlerService.executeCrawl(params.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Execute crawl error:', error);
    return NextResponse.json(
      { error: 'Failed to execute crawl' },
      { status: 500 }
    );
  }
} 
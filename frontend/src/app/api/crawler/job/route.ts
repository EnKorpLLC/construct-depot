import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { CrawlerService } from '@/services/crawler';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const configId = searchParams.get('configId');

  const query = configId 
    ? { where: { configId } }
    : {};

  const jobs = await prisma.crawlerJob.findMany({
    ...query,
    orderBy: { startTime: 'desc' },
    include: { config: true },
  });

  return NextResponse.json(jobs);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403 }
    );
  }

  try {
    const { configId } = await request.json();

    const config = await prisma.crawlerConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      return new NextResponse(
        JSON.stringify({ error: 'Crawler configuration not found' }),
        { status: 404 }
      );
    }

    // Create a new job
    const job = await prisma.crawlerJob.create({
      data: {
        configId,
        status: 'idle',
        pagesProcessed: 0,
        itemsFound: 0,
        errors: [],
      },
    });

    // Start the crawler in the background
    const crawler = new CrawlerService(config, job);
    crawler.start().catch(console.error);

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Job creation error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403 }
    );
  }

  try {
    const { jobId, action } = await request.json();

    if (action !== 'stop') {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400 }
      );
    }

    const job = await prisma.crawlerJob.update({
      where: { id: jobId },
      data: { 
        status: 'completed',
        endTime: new Date(),
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Job update error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
} 
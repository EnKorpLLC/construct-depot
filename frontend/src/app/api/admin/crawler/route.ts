import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authOptions } from '../../auth/[...nextauth]/route';
import { CrawlJobStatus } from '@/services/crawler/types';
import { BaseCrawler } from '@/services/crawler/core/BaseCrawler';

const prisma = new PrismaClient();

// Validation schemas
const newJobSchema = z.object({
  name: z.string().min(1),
  supplierId: z.string().uuid(),
  configurationId: z.string().uuid(),
});

const updateJobSchema = z.object({
  jobId: z.string().uuid(),
  action: z.enum(['pause', 'resume', 'cancel']),
});

// GET /api/admin/crawler
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const jobs = await prisma.crawlerJob.findMany({
      where: {
        status: {
          in: [CrawlJobStatus.RUNNING, CrawlJobStatus.PAUSED]
        }
      },
      include: {
        supplier: true,
        configuration: true,
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    const stats = await prisma.crawlerJob.aggregate({
      where: {
        startTime: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      _count: {
        id: true
      },
      _avg: {
        successRate: true
      },
      _sum: {
        productsProcessed: true
      }
    });

    return NextResponse.json({
      jobs,
      stats: {
        totalJobs: stats._count.id,
        avgSuccessRate: stats._avg.successRate,
        totalProducts: stats._sum.productsProcessed
      }
    });
  } catch (error) {
    console.error('Error fetching crawler jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/crawler
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validatedData = newJobSchema.parse(body);

    const supplier = await prisma.supplier.findUnique({
      where: { id: validatedData.supplierId }
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    const configuration = await prisma.crawlerConfiguration.findUnique({
      where: { id: validatedData.configurationId }
    });

    if (!configuration) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    const job = await prisma.crawlerJob.create({
      data: {
        name: validatedData.name,
        status: CrawlJobStatus.RUNNING,
        supplierId: validatedData.supplierId,
        configurationId: validatedData.configurationId,
        startTime: new Date(),
        progress: 0,
        productsProcessed: 0,
        errors: 0,
      }
    });

    // Start the crawler job
    const crawler = new BaseCrawler(configuration, supplier);
    crawler.start();

    return NextResponse.json(job);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating crawler job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/crawler
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validatedData = updateJobSchema.parse(body);

    const job = await prisma.crawlerJob.findUnique({
      where: { id: validatedData.jobId }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    let newStatus: CrawlJobStatus;
    switch (validatedData.action) {
      case 'pause':
        newStatus = CrawlJobStatus.PAUSED;
        break;
      case 'resume':
        newStatus = CrawlJobStatus.RUNNING;
        break;
      case 'cancel':
        newStatus = CrawlJobStatus.CANCELLED;
        break;
    }

    const updatedJob = await prisma.crawlerJob.update({
      where: { id: validatedData.jobId },
      data: { status: newStatus }
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating crawler job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
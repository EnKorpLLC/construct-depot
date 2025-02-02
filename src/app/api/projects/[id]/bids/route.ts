import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        generalContractor: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only allow GC who owns the project or subcontractor who submitted bid to view bids
    const bids = await prisma.bid.findMany({
      where: {
        projectId: params.id,
        ...(session.user.role === 'SUBCONTRACTOR' && {
          subcontractorId: session.user.id,
        }),
      },
      include: {
        subcontractor: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
    });

    return NextResponse.json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUBCONTRACTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'open') {
      return NextResponse.json(
        { error: 'Project is not accepting bids' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { amount, notes } = data;

    // Check if subcontractor has already submitted a bid
    const existingBid = await prisma.bid.findFirst({
      where: {
        projectId: params.id,
        subcontractorId: session.user.id,
      },
    });

    if (existingBid) {
      return NextResponse.json(
        { error: 'You have already submitted a bid for this project' },
        { status: 400 }
      );
    }

    const bid = await prisma.bid.create({
      data: {
        amount,
        notes,
        status: 'pending',
        projectId: params.id,
        subcontractorId: session.user.id,
      },
      include: {
        subcontractor: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
    });

    return NextResponse.json(bid);
  } catch (error) {
    console.error('Error submitting bid:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'GENERAL_CONTRACTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.generalContractorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const { bidId, status } = data;

    const bid = await prisma.bid.update({
      where: { id: bidId },
      data: { status },
      include: {
        subcontractor: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
    });

    // If bid is accepted, update project status and reject other bids
    if (status === 'accepted') {
      await Promise.all([
        prisma.project.update({
          where: { id: params.id },
          data: { status: 'awarded' },
        }),
        prisma.bid.updateMany({
          where: {
            projectId: params.id,
            id: { not: bidId },
          },
          data: { status: 'rejected' },
        }),
      ]);
    }

    return NextResponse.json(bid);
  } catch (error) {
    console.error('Error updating bid:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
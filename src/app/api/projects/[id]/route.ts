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
        bids: {
          ...(session.user.role === 'GENERAL_CONTRACTOR' && {
            include: {
              subcontractor: {
                select: {
                  id: true,
                  name: true,
                  company: true,
                },
              },
            },
          }),
          ...(session.user.role === 'SUBCONTRACTOR' && {
            where: { subcontractorId: session.user.id },
          }),
        },
        attachments: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate average bid amount
    const projectWithStats = {
      ...project,
      averageBid: project.bids.length > 0
        ? project.bids.reduce((sum, bid) => sum + bid.amount, 0) / project.bids.length
        : null,
    };

    return NextResponse.json(projectWithStats);
  } catch (error) {
    console.error('Error fetching project:', error);
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
    const {
      title,
      description,
      location,
      tradeType,
      budget,
      startDate,
      duration,
      requirements,
      bidsDue,
      scope,
      status,
    } = data;

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        title,
        description,
        location,
        tradeType,
        budget,
        startDate,
        duration,
        requirements,
        bidsDue,
        scope,
        status,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for activity filtering
const querySchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  adminId: z.string().optional(),
  action: z.string().optional(),
  target: z.string().optional()
})

// Helper function to check admin role
async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  return user?.role === 'ADMIN'
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user and check admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams)
    const query = querySchema.parse({
      ...params,
      limit: params.limit ? parseInt(params.limit) : undefined,
      offset: params.offset ? parseInt(params.offset) : undefined
    })

    // Build where clause
    const where = {
      ...(query.startDate && {
        timestamp: {
          gte: new Date(query.startDate)
        }
      }),
      ...(query.endDate && {
        timestamp: {
          lte: new Date(query.endDate)
        }
      }),
      ...(query.adminId && { adminId: query.adminId }),
      ...(query.action && { action: query.action }),
      ...(query.target && { target: query.target })
    }

    // Get activities with pagination
    const [activities, total] = await Promise.all([
      prisma.adminActivity.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: query.limit,
        skip: query.offset,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.adminActivity.count({ where })
    ])

    // Format response
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      adminId: activity.adminId,
      adminName: `${activity.admin.firstName} ${activity.admin.lastName}`,
      action: activity.action,
      target: activity.target,
      timestamp: activity.timestamp,
      details: activity.details
    }))

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: total > query.offset + query.limit
      }
    })
  } catch (error) {
    console.error('[Admin Activities Error]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user and check admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Validate request body
    const body = await request.json()
    const activity = await prisma.adminActivity.create({
      data: {
        adminId: user.id,
        action: body.action,
        target: body.target,
        details: body.details
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      id: activity.id,
      adminId: activity.adminId,
      adminName: `${activity.admin.firstName} ${activity.admin.lastName}`,
      action: activity.action,
      target: activity.target,
      timestamp: activity.timestamp,
      details: activity.details
    })
  } catch (error) {
    console.error('[Admin Activity Create Error]', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 
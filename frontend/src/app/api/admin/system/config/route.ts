import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for configuration
const configSchema = z.object({
  maintenanceMode: z.boolean(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  maxConcurrentJobs: z.number().min(1).max(100),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  notificationsEnabled: z.boolean()
})

type SystemConfig = z.infer<typeof configSchema>

// Helper function to check admin role
async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  return user?.role === 'ADMIN'
}

export async function GET() {
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

    // Get current configuration
    const config = await prisma.systemConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!config) {
      // Return default configuration if none exists
      return NextResponse.json({
        maintenanceMode: false,
        logLevel: 'info',
        maxConcurrentJobs: 10,
        backupFrequency: 'daily',
        notificationsEnabled: true
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('[Config Error]', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
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
    const validatedConfig = configSchema.parse(body)

    // Update configuration
    const config = await prisma.systemConfig.create({
      data: {
        ...validatedConfig,
        updatedBy: user.id
      }
    })

    // Log configuration change
    await prisma.adminActivity.create({
      data: {
        adminId: user.id,
        action: 'UPDATE_CONFIG',
        target: 'SYSTEM_CONFIG',
        details: JSON.stringify(validatedConfig)
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('[Config Update Error]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid configuration', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 
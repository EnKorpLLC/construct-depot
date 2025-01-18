import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import os from 'os'
import prisma from '@/lib/prisma'
import { redis } from '@/lib/redis'

// Helper function to calculate CPU usage
async function getCPUUsage(): Promise<number> {
  const startMeasure = os.cpus().map(cpu => cpu.times)
  await new Promise(resolve => setTimeout(resolve, 100))
  const endMeasure = os.cpus().map(cpu => cpu.times)
  
  const totalDiff = endMeasure.map((end, i) => {
    const start = startMeasure[i]
    return (end.user + end.nice + end.sys + end.idle + end.irq) -
           (start.user + start.nice + start.sys + start.idle + start.irq)
  })
  
  const idleDiff = endMeasure.map((end, i) => {
    const start = startMeasure[i]
    return end.idle - start.idle
  })
  
  const avgUsage = totalDiff.reduce((acc, total, i) => {
    const idle = idleDiff[i]
    return acc + (1 - idle / total) * 100
  }, 0) / totalDiff.length
  
  return Math.round(avgUsage)
}

// Helper function to get memory usage
function getMemoryUsage(): number {
  const total = os.totalmem()
  const free = os.freemem()
  return Math.round(((total - free) / total) * 100)
}

// Helper function to get active users count
async function getActiveUsers(): Promise<number> {
  const activeUsers = await prisma.session.count({
    where: {
      expires: {
        gt: new Date()
      }
    }
  })
  return activeUsers
}

// Helper function to check Redis connection
async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('[Redis Connection Error]', error)
    return false
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get system metrics
    const [cpuUsage, activeUsers, redisConnected] = await Promise.all([
      getCPUUsage(),
      getActiveUsers(),
      checkRedisConnection()
    ])

    const metrics = {
      cpuUsage,
      memoryUsage: getMemoryUsage(),
      diskSpace: 0, // Implement disk space check if needed
      activeUsers,
      redisConnected,
      responseTime: 0, // Implement response time monitoring if needed
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime())
    }

    // Log metrics for monitoring
    console.log('[System Health]', metrics)

    if (!redisConnected) {
      return NextResponse.json(
        { error: 'Redis Connection Failed', metrics },
        { status: 503 }
      )
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('[System Health Error]', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 
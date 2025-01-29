import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeUsers: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: string;
  lastDeployment: string;
  networkUsage: {
    bytesIn: number;
    bytesOut: number;
    connectionsPerSecond: number;
  };
  databaseMetrics: {
    activeConnections: number;
    queryResponseTime: number;
    poolSize: number;
    waitingQueries: number;
  };
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    size: number;
    evictions: number;
  };
  queueMetrics: {
    activeJobs: number;
    waitingJobs: number;
    completedJobs: number;
    failedJobs: number;
    processingTime: number;
  };
  servicesStatus: {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
  }[];
}

export function initializeMetricsSocket(httpServer: HTTPServer) {
  const io = new SocketServer(httpServer, {
    path: '/api/admin/system/metrics/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        next(new Error('Unauthorized'));
      } else {
        next();
      }
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('Client connected to system metrics socket');

    // Function to gather system metrics
    const gatherMetrics = async (): Promise<SystemMetrics> => {
      const [
        cpuMetrics,
        memoryMetrics,
        diskMetrics,
        activeUsers,
        requestMetrics,
        errorMetrics,
        totalRequests,
        networkMetrics,
        dbMetrics,
        cacheMetrics,
        queueMetrics,
        services
      ] = await Promise.all([
        redis.get('system:cpu'),
        redis.get('system:memory'),
        redis.get('system:disk'),
        prisma.session.count({ where: { expires: { gt: new Date() } } }),
        redis.get('system:requests'),
        redis.get('system:errors'),
        redis.get('system:total_requests'),
        redis.hgetall('system:network'),
        redis.hgetall('system:database'),
        redis.hgetall('system:cache'),
        redis.hgetall('system:queue'),
        prisma.service.findMany({
          select: {
            name: true,
            status: true,
            latency: true
          }
        })
      ]);

      const errors = parseInt(errorMetrics || '0');
      const total = parseInt(totalRequests || '1');
      const errorRate = (errors / total) * 100;

      return {
        cpuUsage: parseFloat(cpuMetrics || '0'),
        memoryUsage: parseFloat(memoryMetrics || '0'),
        diskUsage: parseFloat(diskMetrics || '0'),
        activeUsers: activeUsers,
        requestsPerMinute: parseFloat(requestMetrics || '0'),
        averageResponseTime: services.reduce((acc, s) => acc + s.latency, 0) / services.length,
        errorRate: parseFloat(errorRate.toFixed(2)),
        uptime: process.uptime().toString(),
        lastDeployment: process.env.LAST_DEPLOYMENT || new Date().toISOString(),
        networkUsage: {
          bytesIn: parseInt(networkMetrics?.bytesIn || '0'),
          bytesOut: parseInt(networkMetrics?.bytesOut || '0'),
          connectionsPerSecond: parseInt(networkMetrics?.connectionsPerSecond || '0')
        },
        databaseMetrics: {
          activeConnections: parseInt(dbMetrics?.activeConnections || '0'),
          queryResponseTime: parseFloat(dbMetrics?.queryResponseTime || '0'),
          poolSize: parseInt(dbMetrics?.poolSize || '0'),
          waitingQueries: parseInt(dbMetrics?.waitingQueries || '0')
        },
        cacheMetrics: {
          hitRate: parseFloat(cacheMetrics?.hitRate || '0'),
          missRate: parseFloat(cacheMetrics?.missRate || '0'),
          size: parseInt(cacheMetrics?.size || '0'),
          evictions: parseInt(cacheMetrics?.evictions || '0')
        },
        queueMetrics: {
          activeJobs: parseInt(queueMetrics?.activeJobs || '0'),
          waitingJobs: parseInt(queueMetrics?.waitingJobs || '0'),
          completedJobs: parseInt(queueMetrics?.completedJobs || '0'),
          failedJobs: parseInt(queueMetrics?.failedJobs || '0'),
          processingTime: parseFloat(queueMetrics?.processingTime || '0')
        },
        servicesStatus: services.map(s => ({
          name: s.name,
          status: s.status as 'healthy' | 'degraded' | 'down',
          latency: s.latency
        }))
      };
    };

    // Send initial metrics
    try {
      const metrics = await gatherMetrics();
      socket.emit('system_metrics', metrics);
    } catch (error) {
      console.error('Error gathering initial metrics:', error);
    }

    // Set up interval for regular updates
    const updateInterval = setInterval(async () => {
      try {
        const metrics = await gatherMetrics();
        socket.emit('system_metrics', metrics);
      } catch (error) {
        console.error('Error gathering metrics:', error);
      }
    }, 1000); // Update every second

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected from system metrics socket');
      clearInterval(updateInterval);
    });
  });

  return io;
} 
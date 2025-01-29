import { PrismaClient } from '@prisma/client'
import logger from './logger'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Prisma Query', {
      query: e.query,
      params: e.params,
      duration: e.duration,
      timestamp: new Date().toISOString(),
    })
  })
}

// Always log errors
prisma.$on('error', (e) => {
  logger.error('Prisma Error', {
    message: e.message,
    target: e.target,
    timestamp: new Date().toISOString(),
  })
})

// Log other events
prisma.$on('info', (e) => {
  logger.info('Prisma Info', {
    message: e.message,
    timestamp: new Date().toISOString(),
  })
})

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning', {
    message: e.message,
    timestamp: new Date().toISOString(),
  })
})

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 
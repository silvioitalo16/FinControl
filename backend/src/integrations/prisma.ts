import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
})

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug(`[Prisma] ${e.query}`, { duration: `${e.duration}ms` })
  })
}

prisma.$on('error', (e) => {
  logger.error('[Prisma] erro', { message: e.message })
})

prisma.$on('warn', (e) => {
  logger.warn('[Prisma] aviso', { message: e.message })
})

export default prisma

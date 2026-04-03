import { Router } from 'express'
import { z } from 'zod'
import { logger } from '../utils/logger'

const router = Router()

const logSchema = z.object({
  level:     z.enum(['info', 'warn', 'error']),
  message:   z.string().min(1).max(500),
  data:      z.unknown().optional(),
  timestamp: z.string().optional(),
  url:       z.string().optional(),
  userAgent: z.string().optional(),
})

/**
 * POST /api/logs
 * Recebe logs do frontend (erros, warnings) e os registra via Winston.
 * Permite rastrear erros de produção no frontend.
 */
router.post('/', (req, res, next) => {
  try {
    const parsed = logSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Payload de log inválido.' })
      return
    }

    const { level, message, data, timestamp, url, userAgent } = parsed.data
    const meta = {
      source:    'frontend',
      url,
      userAgent: userAgent ?? req.headers['user-agent'],
      clientIp:  (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip,
      timestamp,
      data,
    }

    logger[level](`[FRONTEND] ${message}`, meta)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router

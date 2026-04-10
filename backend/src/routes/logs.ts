import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { logger } from '../utils/logger'

const router = Router()

const logsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Limite de logs excedido.', code: 'RATE_LIMITED' } },
})

const SENSITIVE_LOG_FIELDS = ['password', 'token', 'secret', 'key', 'authorization', 'cookie']
const MAX_DATA_SIZE = 2048 // 2KB

function sanitizeLogData(data: unknown): unknown {
  if (data === undefined || data === null) return data
  const str = JSON.stringify(data)
  if (str.length > MAX_DATA_SIZE) return { _truncated: true, _size: str.length }
  if (typeof data === 'object' && data !== null) {
    const safe = { ...(data as Record<string, unknown>) }
    for (const field of Object.keys(safe)) {
      if (SENSITIVE_LOG_FIELDS.some((s) => field.toLowerCase().includes(s))) {
        safe[field] = '[REDACTED]'
      }
    }
    return safe
  }
  return data
}

const logSchema = z.object({
  level:     z.enum(['info', 'warn', 'error']),
  message:   z.string().min(1).max(500),
  data:      z.unknown().optional(),
  timestamp: z.string().max(50).optional(),
  url:       z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
})

/**
 * POST /api/logs
 * Recebe logs do frontend (erros, warnings) e os registra via Winston.
 * Permite rastrear erros de produção no frontend.
 */
router.post('/', logsLimiter, (req, res, next) => {
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
      data: sanitizeLogData(data),
    }

    logger[level](`[FRONTEND] ${message}`, meta)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router

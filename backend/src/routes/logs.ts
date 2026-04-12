import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { logger, sanitizeDeep, sanitizeUrl } from '../utils/logger'

const router = Router()

const logsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Limite de logs excedido.', code: 'RATE_LIMITED' } },
})

const MAX_DATA_SIZE = 2048 // 2KB

function capSize(data: unknown): unknown {
  if (data === undefined || data === null) return data
  const str = JSON.stringify(data)
  if (str.length > MAX_DATA_SIZE) return { _truncated: true, _size: str.length }
  return sanitizeDeep(data)
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
      url:       sanitizeUrl(url),
      userAgent: userAgent ?? req.headers['user-agent'],
      clientIp:  req.ip,
      timestamp,
      data: capSize(data),
    }

    logger[level](`[FRONTEND] ${message}`, meta)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router

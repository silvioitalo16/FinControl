import morgan from 'morgan'
import { logger, sanitizeDeep } from '../utils/logger'
import type { Request, Response } from 'express'

// Redireciona o output do Morgan para o Winston
const stream = { write: (msg: string) => logger.http(msg.trim()) }

// Formato customizado: método + url + status + tempo
morgan.token('body', (req: Request) => {
  const body = (req as Request & { body: unknown }).body
  if (!body || typeof body !== 'object' || Object.keys(body as object).length === 0) return '-'
  return JSON.stringify(sanitizeDeep(body))
})

morgan.token('ip', (req: Request) => req.ip ?? '-')

export const requestLogger = morgan(
  ':ip :method :url :status :res[content-length]b - :response-time ms | body: :body',
  { stream },
)

// Log de resposta lenta (> 2s) como warn
export function slowRequestLogger(req: Request, res: Response, next: () => void) {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    if (ms > 2000) {
      logger.warn(`Requisição lenta: ${req.method} ${req.originalUrl}`, { ms, status: res.statusCode })
    }
  })
  next()
}

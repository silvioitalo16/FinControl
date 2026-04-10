import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { env } from '../config/env'

export interface AppError extends Error {
  statusCode?: number
  code?:       string
}

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'authorization', 'cookie', 'credit_card']

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body
  const safe = { ...(body as Record<string, unknown>) }
  for (const field of Object.keys(safe)) {
    if (SENSITIVE_FIELDS.some((s) => field.toLowerCase().includes(s))) {
      safe[field] = '[REDACTED]'
    }
  }
  return safe
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.statusCode ?? 500
  const isDev  = env.NODE_ENV === 'development'

  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    status,
    code:  err.code,
    stack: isDev ? err.stack : undefined,
    body:  sanitizeBody(req.body),
  })

  res.status(status).json({
    error: {
      message: status === 500 && !isDev ? 'Erro interno do servidor.' : err.message,
      code:    err.code,
      ...(isDev && { stack: err.stack }),
    },
  })
}

// Helper para criar erros com statusCode
export function createError(message: string, statusCode = 500, code?: string): AppError {
  const err: AppError = new Error(message)
  err.statusCode = statusCode
  err.code = code
  return err
}

import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import { env } from '../config/env'

const logDir = path.join(process.cwd(), 'logs')

// ── Formato do console (legível para humanos) ────────────────────────────────
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n  ${JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')}`
      : ''
    return `${timestamp} [${level}] ${message}${metaStr}`
  }),
)

// ── Formato dos arquivos (JSON estruturado) ──────────────────────────────────
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

// ── Transporte: rotação diária de arquivos ───────────────────────────────────
const dailyRotate = (level: string, filename: string) =>
  new DailyRotateFile({
    level,
    dirname:        logDir,
    filename:       `${filename}-%DATE%.log`,
    datePattern:    'YYYY-MM-DD',
    zippedArchive:  true,
    maxSize:        '20m',
    maxFiles:       '30d',
    format:         fileFormat,
  })

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports: [
    // Console sempre ativo
    new winston.transports.Console({ format: consoleFormat }),

    // Arquivo só com erros
    dailyRotate('error', 'error'),

    // Arquivo com tudo (info, warn, error, http)
    dailyRotate('http', 'combined'),
  ],
})

// Atalhos tipados
export function logInfo (msg: string, meta?: object) { logger.info (msg, meta) }
export function logWarn (msg: string, meta?: object) { logger.warn (msg, meta) }
export function logError(msg: string, meta?: object) { logger.error(msg, meta) }
export function logHttp (msg: string, meta?: object) { logger.http (msg, meta) }

// ── Sanitização de dados sensíveis ───────────────────────────────────────────
const SENSITIVE_KEY_PATTERNS = [
  'password', 'passwd', 'pwd',
  'token', 'access_token', 'refresh_token', 'accesstoken', 'refreshtoken',
  'secret', 'api_key', 'apikey', 'client_secret',
  'authorization', 'cookie', 'session',
  'credit_card', 'creditcard', 'card_number', 'cvv', 'cvc',
  'private_key', 'privatekey',
]

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase()
  return SENSITIVE_KEY_PATTERNS.some((p) => lower.includes(p))
}

const MAX_DEPTH = 6
const MAX_STRING = 2000

/**
 * Redaciona recursivamente chaves sensíveis em objetos aninhados.
 * Também trunca strings gigantes para evitar bloat de logs.
 */
export function sanitizeDeep(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[MAX_DEPTH]'
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…[truncated]` : value
  }
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => sanitizeDeep(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = isSensitiveKey(k) ? '[REDACTED]' : sanitizeDeep(v, depth + 1)
  }
  return out
}

/**
 * Remove querystring e fragment de uma URL antes de logar.
 * Evita vazar tokens que o Supabase coloca no hash (#access_token=…).
 */
export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return url
  try {
    const u = new URL(url)
    return `${u.origin}${u.pathname}`
  } catch {
    // Não é URL absoluta — devolve só o caminho antes de ? ou #
    return url.split(/[?#]/)[0]
  }
}

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

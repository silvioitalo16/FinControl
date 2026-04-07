import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env'
import { logger } from './utils/logger'
import { requestLogger, slowRequestLogger } from './middleware/requestLogger'
import { errorHandler } from './middleware/errorHandler'
import { router } from './routes'

const app = express()

// ── Segurança ────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      env.CORS_ORIGIN,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

// ── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Logging de requisições ───────────────────────────────────────────────────
app.use(requestLogger)
app.use(slowRequestLogger)

// ── Timeout global (10 s) ────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setTimeout(10_000, () => {
    res.status(503).json({ error: { message: 'O servidor demorou demais para responder.', code: 'TIMEOUT' } })
  })
  next()
})

// ── Rotas ────────────────────────────────────────────────────────────────────
app.use('/api', router)

// 404
app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Rota não encontrada.', code: 'NOT_FOUND' } })
})

// ── Tratamento global de erros ───────────────────────────────────────────────
app.use(errorHandler)

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = Number(env.PORT)
app.listen(PORT, () => {
  logger.info(`🚀 FinControl API rodando em http://localhost:${PORT}`)
  logger.info(`📋 Ambiente: ${env.NODE_ENV}`)
  logger.info(`🔗 Frontend permitido: ${env.CORS_ORIGIN}`)
})

// Captura de erros não tratados
process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', { reason })
})
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { message: err.message, stack: err.stack })
  process.exit(1)
})

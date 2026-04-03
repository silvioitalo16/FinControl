import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'
import { logger } from '../utils/logger'

const router = Router()

/**
 * GET /api/health
 * Verifica se o servidor e a conexão com o Supabase estão operacionais.
 */
router.get('/', async (_req, res, next) => {
  try {
    const start = Date.now()
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1)
    const dbMs = Date.now() - start

    if (error) throw error

    const payload = {
      status:    'ok',
      timestamp: new Date().toISOString(),
      uptime:    Math.floor(process.uptime()),
      db:        { status: 'ok', latency_ms: dbMs },
    }

    logger.info('Health check OK', { dbMs })
    res.json(payload)
  } catch (err) {
    logger.error('Health check falhou', { err })
    next(err)
  }
})

export default router

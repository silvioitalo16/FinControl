import { Router } from 'express'
import healthRouter from './health'
import logsRouter   from './logs'

const router = Router()

router.use('/health', healthRouter)
router.use('/logs',   logsRouter)

// Rota base da API
router.get('/', (_req, res) => {
  res.json({ name: 'FinControl API', version: '1.0.0', status: 'running' })
})

export { router }

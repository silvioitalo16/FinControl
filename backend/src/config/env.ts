import dotenv from 'dotenv'
import path from 'path'
import { z } from 'zod'

// Carrega o .env da raiz do monorepo (um nível acima de backend/)
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') })

const schema = z.object({
  PORT:                      z.string().default('3001'),
  CORS_ORIGIN:               z.string().default('http://localhost:5173'),
  NODE_ENV:                  z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL:                 z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  SUPABASE_URL:              z.string().min(1, 'SUPABASE_URL obrigatório'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY obrigatório'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data

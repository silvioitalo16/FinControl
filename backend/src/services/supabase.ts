import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

/**
 * Cliente Supabase com service_role — acesso total ao banco.
 * NUNCA exponha este cliente ou a chave no frontend.
 * Use apenas no backend para operações administrativas.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken:  false,
      persistSession:    false,
    },
  },
)

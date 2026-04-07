import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

/**
 * Cliente Supabase com service_role.
 * Fica centralizado em integrations porque é dependência externa do backend.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

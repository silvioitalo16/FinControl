import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/app/types/database.types'
import { useAuthStore } from '@/app/stores/auth.store'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.')
}

// Singleton: reutiliza a instância existente no hot reload do Vite
const GLOBAL_KEY = '__supabase_singleton__'
const g = globalThis as Record<string, unknown>

if (!g[GLOBAL_KEY]) {
  g[GLOBAL_KEY] = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      // Desabilitado: o backend usa admin.generateLink (fluxo implícito com
      // tokens no hash), enquanto o client está em PKCE. O ResetPassword parseia
      // o fragmento manualmente e chama setSession. Deixar o Supabase processar
      // o hash sozinho trava a Promise de setSession por conflito de estado.
      detectSessionInUrl: false,
      flowType: 'pkce',
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
  })
}

export const supabase = g[GLOBAL_KEY] as SupabaseClient<Database>

// Helper síncrono: lê o user_id do store em memória (zero rede)
export function getAuthUserId(): string {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Usuário não autenticado.')
  return userId
}

import type { PostgrestError } from '@supabase/supabase-js'

const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos.',
  'Email not confirmed': 'Confirme seu email antes de fazer login.',
  'User already registered': 'Este email já está cadastrado.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Auth session missing': 'Sessão expirada. Faça login novamente.',
  'JWT expired': 'Sessão expirada. Faça login novamente.',
  'duplicate key value violates unique constraint': 'Este registro já existe.',
  'violates foreign key constraint': 'Referência inválida.',
  'violates check constraint': 'Valor inválido para este campo.',
  'new row violates row-level security': 'Operação não permitida.',
}

export function parseSupabaseError(error: unknown): string {
  if (!error) return 'Erro desconhecido.'

  const message = (error as PostgrestError | Error)?.message ?? String(error)

  // Traduz mensagens conhecidas do Supabase (em inglês)
  for (const [key, translation] of Object.entries(SUPABASE_ERROR_MESSAGES)) {
    if (message.includes(key)) return translation
  }

  // Mensagens curtas e legíveis (inclusive as do nosso backend em português)
  // são devolvidas tal qual. O limite de 200 protege contra stack traces e
  // dumps de PostgrestError que não fazem sentido para o usuário final.
  if (message && message.length > 0 && message.length <= 200) {
    return message
  }

  return 'Algo deu errado. Tente novamente.'
}

export function isAuthError(error: unknown): boolean {
  const message = (error as Error)?.message ?? ''
  return message.includes('Auth') || message.includes('JWT') || message.includes('session')
}

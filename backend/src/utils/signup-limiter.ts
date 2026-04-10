/**
 * Rate limiter granular para signup: limita por domínio de email e por IP.
 * Usa store em memória com limpeza automática.
 *
 * Limites padrão (por janela de 1h):
 *  - Máx 5 cadastros por domínio de email
 *  - Máx 3 cadastros por IP
 */

interface Entry {
  count: number
  expiresAt: number
}

const WINDOW_MS = 60 * 60 * 1000 // 1 hora
const MAX_PER_DOMAIN = 5
const MAX_PER_IP = 3

const domainStore = new Map<string, Entry>()
const ipStore = new Map<string, Entry>()

// Limpeza periódica a cada 10 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of domainStore) {
    if (entry.expiresAt <= now) domainStore.delete(key)
  }
  for (const [key, entry] of ipStore) {
    if (entry.expiresAt <= now) ipStore.delete(key)
  }
}, 10 * 60 * 1000).unref()

function increment(store: Map<string, Entry>, key: string): number {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.expiresAt <= now) {
    store.set(key, { count: 1, expiresAt: now + WINDOW_MS })
    return 1
  }

  existing.count++
  return existing.count
}

function check(store: Map<string, Entry>, key: string, max: number): boolean {
  const now = Date.now()
  const existing = store.get(key)
  if (!existing || existing.expiresAt <= now) return true
  return existing.count < max
}

export interface SignupLimitResult {
  allowed: boolean
  reason?: 'DOMAIN_LIMIT' | 'IP_LIMIT'
}

/**
 * Verifica se o signup deve ser permitido com base no domínio e IP.
 * Chame `recordSignup()` após um signup bem-sucedido.
 */
export function checkSignupLimit(emailDomain: string, ip: string): SignupLimitResult {
  if (!check(domainStore, emailDomain, MAX_PER_DOMAIN)) {
    return { allowed: false, reason: 'DOMAIN_LIMIT' }
  }
  if (!check(ipStore, ip, MAX_PER_IP)) {
    return { allowed: false, reason: 'IP_LIMIT' }
  }
  return { allowed: true }
}

/** Registra um signup bem-sucedido nos contadores. */
export function recordSignup(emailDomain: string, ip: string): void {
  increment(domainStore, emailDomain)
  increment(ipStore, ip)
}

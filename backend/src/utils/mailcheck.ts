import { logger } from './logger'

/**
 * Mailcheck.ai — API gratuita e ilimitada que verifica em tempo real se um
 * domínio é descartável. Atualizada constantemente pela comunidade.
 *
 * Endpoint: https://api.mailcheck.ai/email/{email}
 * Resposta:
 *   {
 *     "status": 200,
 *     "email": "user@example.com",
 *     "domain": "example.com",
 *     "mx": true,
 *     "disposable": false,
 *     "public_domain": false
 *   }
 *
 * Não requer API key. Usa fetch nativo do Node 18+.
 */

interface MailcheckResponse {
  status?: number
  email?: string
  domain?: string
  mx?: boolean
  disposable?: boolean
  public_domain?: boolean
}

const TIMEOUT_MS = 3000

/**
 * Verifica se o email é descartável via Mailcheck.ai.
 * Retorna `true` se for descartável.
 * Em caso de timeout/erro, retorna `false` (fail-open) — confiamos na lista local.
 */
export async function isDisposableViaMailcheck(email: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`https://api.mailcheck.ai/email/${encodeURIComponent(email)}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FinControl-AntiAbuse/1.0' },
    })

    if (!res.ok) {
      logger.warn('[Mailcheck] resposta não-OK', { status: res.status })
      return false
    }

    const data: MailcheckResponse = await res.json()
    return data.disposable === true
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      logger.warn('[Mailcheck] timeout', { email: email.split('@')[1] })
    } else {
      logger.warn('[Mailcheck] erro', { error: String(err) })
    }
    return false // fail-open: não bloqueia se a API falhou
  } finally {
    clearTimeout(timeout)
  }
}

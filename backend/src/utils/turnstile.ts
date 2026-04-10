import { env } from '../config/env'
import { logger } from './logger'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface TurnstileResult {
  success: boolean
  'error-codes'?: string[]
}

/**
 * Verifica token Turnstile com a API do Cloudflare.
 * Se TURNSTILE_SECRET_KEY não estiver configurado, permite a requisição (dev mode).
 */
export async function verifyTurnstile(token: string | undefined, ip: string | undefined): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true // dev mode — sem Turnstile
  if (!token) return false

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    })

    const data: TurnstileResult = await res.json()

    if (!data.success) {
      logger.warn('Turnstile verification failed', { errors: data['error-codes'] })
    }

    return data.success
  } catch (err) {
    logger.error('Turnstile verification error', { error: String(err) })
    return false
  }
}

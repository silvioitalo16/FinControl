import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { env } from '../config/env'
import { supabaseAdmin } from '../integrations/supabase'
import { requireAuth } from '../middleware/auth'
import { createError } from '../middleware/errorHandler'
import { emailService } from '../services/email.service'
import { isDisposableEmail } from '../utils/disposable-domains'
import { logger } from '../utils/logger'
import { isDisposableViaMailcheck } from '../utils/mailcheck'
import { calculateRiskScore } from '../utils/risk-score'
import { checkSignupLimit, recordSignup } from '../utils/signup-limiter'
import { verifyTurnstile } from '../utils/turnstile'

/** Mascara email para logs: s***@gmail.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  return `${local[0]}***@${domain}`
}

/** Extrai domínio do email */
function emailDomain(email: string): string {
  return email.split('@')[1] ?? 'unknown'
}

/** Metadata de telemetria para logs de auth */
function authMeta(req: import('express').Request, email: string) {
  return {
    email: maskEmail(email),
    domain: emailDomain(email),
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip,
    userAgent: req.headers['user-agent']?.substring(0, 200),
  }
}

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Muitas tentativas. Tente novamente em 15 minutos.', code: 'RATE_LIMITED' } },
})

const signUpSchema = z.object({
  full_name: z.string().min(3).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'A senha deve conter uma letra maiúscula.')
    .regex(/[0-9]/, 'A senha deve conter um número.'),
  turnstileToken: z.string().optional(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  turnstileToken: z.string().optional(),
})

router.post('/sign-up', authLimiter, async (req, res, next) => {
  try {
    const payload = signUpSchema.parse(req.body)

    const meta = authMeta(req, payload.email)

    const turnstileOk = await verifyTurnstile(payload.turnstileToken, meta.ip)
    if (!turnstileOk) {
      logger.warn('[SIGNUP] Turnstile falhou', { ...meta, reason: 'CAPTCHA_FAILED' })
      throw createError('Verificação de segurança falhou. Tente novamente.', 403, 'CAPTCHA_FAILED')
    }

    if (isDisposableEmail(payload.email)) {
      logger.warn('[SIGNUP] Email descartável bloqueado (lista local)', { ...meta, reason: 'DISPOSABLE_EMAIL_LOCAL' })
      throw createError('Use um email pessoal ou corporativo válido.', 422, 'DISPOSABLE_EMAIL')
    }

    // Segunda camada: API externa Mailcheck.ai (gratuita, atualizada em tempo real)
    if (await isDisposableViaMailcheck(payload.email)) {
      logger.warn('[SIGNUP] Email descartável bloqueado (Mailcheck.ai)', { ...meta, reason: 'DISPOSABLE_EMAIL_API' })
      throw createError('Use um email pessoal ou corporativo válido.', 422, 'DISPOSABLE_EMAIL')
    }

    const limitCheck = checkSignupLimit(meta.domain, meta.ip ?? '')
    if (!limitCheck.allowed) {
      logger.warn('[SIGNUP] Rate limit granular atingido', { ...meta, reason: limitCheck.reason })
      throw createError('Muitas tentativas de cadastro. Tente novamente mais tarde.', 429, limitCheck.reason)
    }

    const risk = calculateRiskScore({ email: payload.email, ip: meta.ip, userAgent: meta.userAgent })
    if (risk.score >= 5) {
      logger.warn('[SIGNUP] Score de risco alto — bloqueado', { ...meta, riskScore: risk.score, riskFlags: risk.flags })
      throw createError('Cadastro bloqueado por motivos de segurança.', 403, 'HIGH_RISK')
    }
    if (risk.score >= 3) {
      logger.warn('[SIGNUP] Score de risco moderado — permitido com alerta', { ...meta, riskScore: risk.score, riskFlags: risk.flags })
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: payload.email,
      password: payload.password,
      options: {
        data: { full_name: payload.full_name },
        redirectTo: `${env.APP_URL}/dashboard`,
      },
    })

    if (error || !data.properties?.action_link) {
      throw error ?? createError('Não foi possível gerar o link de confirmação.', 500, 'SIGNUP_LINK_FAILED')
    }

    await emailService.sendSignUpConfirmationEmail({
      email: payload.email,
      fullName: payload.full_name,
      actionLink: data.properties.action_link,
    })

    recordSignup(meta.domain, meta.ip ?? '')
    logger.info('[SIGNUP] Cadastro realizado com sucesso', meta)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const payload = forgotPasswordSchema.parse(req.body)

    const meta = authMeta(req, payload.email)

    const turnstileOk = await verifyTurnstile(payload.turnstileToken, meta.ip)
    if (!turnstileOk) {
      logger.warn('[FORGOT-PWD] Turnstile falhou', { ...meta, reason: 'CAPTCHA_FAILED' })
      throw createError('Verificação de segurança falhou. Tente novamente.', 403, 'CAPTCHA_FAILED')
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: payload.email,
      options: {
        redirectTo: `${env.APP_URL}/reset-password`,
      },
    })

    // Não revelar se o email existe — enviar email só se o usuário existir,
    // mas sempre retornar 204 para evitar enumeração de usuários.
    if (!error && data.properties?.action_link) {
      await emailService.sendPasswordRecoveryEmail({
        email: payload.email,
        fullName: typeof data.user?.user_metadata?.full_name === 'string' ? data.user.user_metadata.full_name : undefined,
        actionLink: data.properties.action_link,
      }).catch((emailErr) => {
        logger.warn('[FORGOT-PWD] Falha ao enviar email', { ...meta, error: String(emailErr) })
      })
      logger.info('[FORGOT-PWD] Email de recuperação enviado', meta)
    }

    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

router.post('/password-changed', requireAuth, async (req, res, next) => {
  try {
    if (!req.userEmail) {
      throw createError('Usuário autenticado sem email disponível.', 400, 'MISSING_USER_EMAIL')
    }

    await emailService.sendPasswordChangedNotification({
      email: req.userEmail,
      fullName: typeof req.userMetadata?.full_name === 'string' ? req.userMetadata.full_name : undefined,
      appUrl: env.APP_URL,
    })

    logger.info('Notificação de senha alterada enviada via Resend.', {
      userId: req.userId,
      email: maskEmail(req.userEmail),
    })

    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router

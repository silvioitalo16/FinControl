import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { env } from '../config/env'
import { supabaseAdmin } from '../integrations/supabase'
import { requireAuth } from '../middleware/auth'
import { createError } from '../middleware/errorHandler'
import { emailService } from '../services/email.service'
import { logger } from '../utils/logger'

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
})

const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
})

router.post('/sign-up', authLimiter, async (req, res, next) => {
  try {
    const payload = signUpSchema.parse(req.body)

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

    logger.info('Email de confirmação enviado via Resend.', { email: payload.email })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const payload = forgotPasswordSchema.parse(req.body)

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
        logger.warn('Falha ao enviar email de recuperação.', { email: payload.email, error: String(emailErr) })
      })
      logger.info('Email de recuperação enviado via Resend.', { email: payload.email })
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
      email: req.userEmail,
    })

    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router

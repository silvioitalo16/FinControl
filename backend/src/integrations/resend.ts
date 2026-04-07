import { env } from '../config/env'
import { createError } from '../middleware/errorHandler'

interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
}

interface ResendSendEmailResponse {
  id?: string
  error?: {
    message?: string
    name?: string
  }
}

const RESEND_API_URL = 'https://api.resend.com/emails'

export async function sendTransactionalEmail({ to, subject, html }: SendEmailInput) {
  if (!env.RESEND_API_KEY) {
    throw createError('RESEND_API_KEY não configurada no backend.', 500, 'RESEND_NOT_CONFIGURED')
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  })

  const payload = await response.json() as ResendSendEmailResponse

  if (!response.ok || payload.error) {
    throw createError(payload.error?.message ?? 'Falha ao enviar email via Resend.', 502, 'RESEND_SEND_FAILED')
  }

  return payload
}

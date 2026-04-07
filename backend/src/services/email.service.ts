import { sendTransactionalEmail } from '../integrations/resend'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function renderEmailShell(params: {
  preheader: string
  title: string
  subtitle: string
  buttonLabel: string
  buttonUrl: string
  footerText: string
  accentColor?: string
  recipientName?: string
}) {
  const accentColor = params.accentColor ?? '#0f766e'
  const safeRecipientName = params.recipientName ? escapeHtml(params.recipientName) : ''

  return `
    <div style="background:#f3f7f8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        ${escapeHtml(params.preheader)}
      </div>
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
        <div style="padding:32px;background:linear-gradient(135deg, ${accentColor} 0%, #111827 100%);color:#ffffff;">
          <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">FinControl</div>
          <h1 style="margin:16px 0 8px;font-size:28px;line-height:1.2;">${escapeHtml(params.title)}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;opacity:0.92;">
            ${safeRecipientName ? `Olá, ${safeRecipientName}. ` : ''}${escapeHtml(params.subtitle)}
          </p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#334155;">
            Use o botão abaixo para continuar com segurança.
          </p>
          <a href="${escapeHtml(params.buttonUrl)}"
             style="display:inline-block;padding:14px 22px;border-radius:14px;background:${accentColor};color:#ffffff;text-decoration:none;font-weight:700;">
            ${escapeHtml(params.buttonLabel)}
          </a>
          <p style="margin:24px 0 8px;font-size:13px;line-height:1.7;color:#64748b;">
            Se o botão não funcionar, copie e cole este link no navegador:
          </p>
          <p style="margin:0 0 24px;font-size:13px;line-height:1.7;word-break:break-all;color:#0f766e;">
            ${escapeHtml(params.buttonUrl)}
          </p>
          <div style="padding-top:24px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.7;color:#64748b;">
            ${escapeHtml(params.footerText)}
          </div>
        </div>
      </div>
    </div>
  `.trim()
}

export const emailService = {
  async sendSignUpConfirmationEmail(params: { email: string; fullName?: string; actionLink: string }): Promise<void> {
    const html = renderEmailShell({
      preheader: 'Confirme sua conta no FinControl.',
      title: 'Confirme seu cadastro',
      subtitle: 'Seu acesso ao FinControl está quase pronto. Falta só confirmar seu email.',
      buttonLabel: 'Confirmar conta',
      buttonUrl: params.actionLink,
      footerText: 'Se você não criou esta conta, pode ignorar esta mensagem.',
      accentColor: '#0f766e',
      recipientName: params.fullName,
    })

    await sendTransactionalEmail({
      to: params.email,
      subject: 'Confirme seu cadastro no FinControl',
      html,
    })
  },

  async sendPasswordRecoveryEmail(params: { email: string; fullName?: string; actionLink: string }): Promise<void> {
    const html = renderEmailShell({
      preheader: 'Recupere sua senha do FinControl.',
      title: 'Redefina sua senha',
      subtitle: 'Recebemos uma solicitação para redefinir sua senha. O link abaixo abre a tela segura de atualização.',
      buttonLabel: 'Redefinir senha',
      buttonUrl: params.actionLink,
      footerText: 'Se você não pediu a redefinição, ignore este email e sua senha atual continuará válida.',
      accentColor: '#2563eb',
      recipientName: params.fullName,
    })

    await sendTransactionalEmail({
      to: params.email,
      subject: 'Redefinição de senha do FinControl',
      html,
    })
  },

  async sendPasswordChangedNotification(params: { email: string; fullName?: string; appUrl: string }): Promise<void> {
    const html = renderEmailShell({
      preheader: 'Sua senha foi alterada com sucesso.',
      title: 'Senha atualizada',
      subtitle: 'Estamos avisando que a senha da sua conta FinControl acabou de ser alterada.',
      buttonLabel: 'Abrir FinControl',
      buttonUrl: params.appUrl,
      footerText: 'Se você não reconhece essa alteração, redefina sua senha imediatamente e revise o acesso à conta.',
      accentColor: '#7c3aed',
      recipientName: params.fullName,
    })

    await sendTransactionalEmail({
      to: params.email,
      subject: 'Sua senha do FinControl foi alterada',
      html,
    })
  },
}

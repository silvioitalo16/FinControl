/**
 * Lista de domínios de email descartáveis/temporários conhecidos.
 *
 * Essa lista cobre os serviços mais populares. Para manter atualizada,
 * considere integrar uma API de reputação de email no futuro (Fase 3).
 *
 * Fonte: compilação de serviços como temp-mail.org, guerrillamail, mailinator, etc.
 */
const DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set([
  // ── Temp Mail / Mail.tm ──
  'temp-mail.org',
  'tempmail.com',
  'tempmail.net',
  'temp-mail.io',
  'tempmailo.com',
  'mail.tm',
  'tempail.com',

  // ── Guerrilla Mail ──
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.de',
  'guerrillamailblock.com',
  'grr.la',
  'sharklasers.com',
  'guerrillamail.info',

  // ── Mailinator ──
  'mailinator.com',
  'mailinator.net',
  'mailinator2.com',
  'maildrop.cc',

  // ── 10MinuteMail / MinuteInbox ──
  '10minutemail.com',
  '10minutemail.net',
  'minutemail.com',
  'minuteinbox.com',
  'tempinbox.com',

  // ── YOPmail ──
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',

  // ── ThrowAway / Discard ──
  'throwaway.email',
  'throwaway.com',
  'dispostable.com',
  'disposableemailaddresses.emailmiser.com',

  // ── Mohmal / Emailondeck ──
  'mohmal.com',
  'emailondeck.com',

  // ── Nada / Temp Mail Plus ──
  'getnada.com',
  'tempmail.plus',
  'tempmail.ninja',

  // ── Fake Mail Generator / Trash Mail ──
  'fakemailgenerator.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'trashmail.org',
  'trash-mail.com',

  // ── Burner Mail / Mailnesia ──
  'burnermail.io',
  'mailnesia.com',
  'mailnator.com',

  // ── Outros populares ──
  'discard.email',
  'mailsac.com',
  'mytemp.email',
  'tempmailer.com',
  'tempr.email',
  'harakirimail.com',
  'mailcatch.com',
  'emailfake.com',
  'crazymailing.com',
  'inboxkitten.com',
  'tmpmail.org',
  'tmpmail.net',
  'mailforspam.com',
  'safetymail.info',
  'filzmail.com',
  'spamgourmet.com',
  'jetable.org',
  'getairmail.com',
  'yomail.info',
  'binkmail.com',
  'spaml.com',
  'dropmail.me',
  'emkei.cz',
  'maildrop.cc',
  'tmail.ws',
  'tempemails.io',
])

/**
 * Verifica se um email usa domínio descartável.
 * Retorna `true` se o domínio for descartável (deve ser bloqueado).
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return DISPOSABLE_DOMAINS.has(domain)
}

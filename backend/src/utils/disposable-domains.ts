import { DISPOSABLE_DOMAINS_LIST } from './disposable-domains-data'

/**
 * Set imutável com 5300+ domínios descartáveis mantidos pela comunidade.
 * Carregado do arquivo auto-gerado disposable-domains-data.ts.
 *
 * Para atualizar:
 *   curl -sL https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf -o backend/src/utils/disposable-domains.txt
 *   node backend/src/utils/build-list.cjs
 */
const DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set(DISPOSABLE_DOMAINS_LIST)

/**
 * Verifica se um email usa domínio descartável (lista local).
 * Retorna `true` se o domínio for descartável (deve ser bloqueado).
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return DISPOSABLE_DOMAINS.has(domain)
}

export const disposableDomainCount = DISPOSABLE_DOMAINS.size

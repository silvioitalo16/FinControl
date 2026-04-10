/**
 * Score de risco para signup.
 * Pontuação: 0 = seguro, >= 5 = bloquear, 3-4 = alerta.
 */

// Padrões de local-part que bots costumam usar (aleatório)
const RANDOM_EMAIL_RE = /^[a-z0-9]{15,}$/
const SEQUENTIAL_NUMBERS_RE = /\d{6,}/

// User-agents suspeitos
const SUSPICIOUS_UA = [
  'python-requests',
  'curl/',
  'wget/',
  'httpie/',
  'postman',
  'insomnia',
  'node-fetch',
  'axios/',
  'go-http-client',
]

export interface RiskResult {
  score: number
  flags: string[]
}

export function calculateRiskScore(params: {
  email: string
  ip: string | undefined
  userAgent: string | undefined
}): RiskResult {
  const flags: string[] = []
  let score = 0
  const { email, userAgent } = params

  const [localPart, domain] = email.split('@')

  // 1. Local-part parece gerado aleatoriamente (+2)
  if (localPart && RANDOM_EMAIL_RE.test(localPart)) {
    score += 2
    flags.push('random_local_part')
  }

  // 2. Local-part com sequência numérica longa (+1)
  if (localPart && SEQUENTIAL_NUMBERS_RE.test(localPart)) {
    score += 1
    flags.push('sequential_numbers')
  }

  // 3. Domínio pouco comum — não é dos grandes provedores (+1)
  const commonDomains = [
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'yahoo.com.br',
    'live.com', 'icloud.com', 'protonmail.com', 'proton.me',
    'uol.com.br', 'bol.com.br', 'terra.com.br', 'ig.com.br',
  ]
  if (domain && !commonDomains.includes(domain)) {
    score += 1
    flags.push('uncommon_domain')
  }

  // 4. User-agent suspeito (+3)
  if (userAgent) {
    const uaLower = userAgent.toLowerCase()
    if (SUSPICIOUS_UA.some((s) => uaLower.includes(s))) {
      score += 3
      flags.push('suspicious_user_agent')
    }
  }

  // 5. Sem user-agent (+2)
  if (!userAgent) {
    score += 2
    flags.push('missing_user_agent')
  }

  // 6. Local-part muito curto (< 3 caracteres) (+1)
  if (localPart && localPart.length < 3) {
    score += 1
    flags.push('short_local_part')
  }

  return { score, flags }
}

// Limites por plano
export const PLAN_LIMITS = {
  free: {
    transactionsPerMonth: 100,
    activeGoals: 5,
    customCategories: 10,
  },
  premium: {
    transactionsPerMonth: Infinity,
    activeGoals: Infinity,
    customCategories: Infinity,
  },
} as const

// Paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

// Orçamento: thresholds de alerta
export const BUDGET_ALERT_THRESHOLD = 80  // % para aviso amarelo
export const BUDGET_EXCEEDED_THRESHOLD = 100 // % para alerta vermelho

// Notificações
export const MAX_NOTIFICATIONS = 500
export const NOTIFICATIONS_RETENTION_DAYS = 90

// Transações
export const MAX_TRANSACTION_AMOUNT = 999_999_999.99
export const MAX_FUTURE_TRANSACTION_DAYS = 365

// Upload
export const MAX_AVATAR_SIZE_MB = 2
export const AVATAR_BUCKET = 'avatars'
export const ALLOWED_AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

/** Mapeia MIME → extensão canônica (não confia no nome do arquivo). */
export const AVATAR_MIME_TO_EXT: Record<string, string> = {
  'image/png':  'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

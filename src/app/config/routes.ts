export const ROUTES = {
  // Públicas
  LOGIN: '/',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Protegidas
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  GOALS: '/goals',
  PLANNING: '/planning',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
} as const

export type AppRoute = typeof ROUTES[keyof typeof ROUTES]

import type { TransactionFilters } from '@/app/types'

export const QUERY_KEYS = {
  // Auth
  profile: () => ['profile'] as const,
  settings: () => ['settings'] as const,

  // Transactions
  transactions: (filters?: TransactionFilters) =>
    filters ? ['transactions', filters] as const : ['transactions'] as const,
  transactionsSummary: (month: string) => ['transactions', 'summary', month] as const,

  // Categories
  categories: () => ['categories'] as const,

  // Goals
  goals: () => ['goals'] as const,
  goal: (id: string) => ['goals', id] as const,
  goalContributions: (goalId: string) => ['goals', goalId, 'contributions'] as const,

  // Budgets
  budgets: (month: string) => ['budgets', month] as const,

  // Notifications
  notifications: () => ['notifications'] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,

  // Dashboard
  dashboard: (month: string) => ['dashboard', month] as const,
} as const

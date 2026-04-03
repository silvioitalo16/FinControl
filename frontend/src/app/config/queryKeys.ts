import type { TransactionFilters } from '@/app/types'

export const QUERY_KEYS = {
  // Auth / Profile
  profile:  () => ['profile']  as const,
  settings: () => ['settings'] as const,

  // Transactions
  transactions: (filters?: TransactionFilters) =>
    filters ? ['transactions', filters] as const : ['transactions'] as const,
  transactionsSummary: (month?: string) =>
    month ? ['transactions', 'summary', month] as const : ['transactions', 'summary'] as const,

  // Categories
  categories: () => ['categories'] as const,

  // Goals
  goals:             ()         => ['goals']                        as const,
  goal:              (id: string) => ['goals', id]                  as const,
  goalContributions: (goalId: string) => ['goals', goalId, 'contributions'] as const,

  // Budgets — sem mês = prefixo para invalidar todos os meses
  budgets: (month?: string) =>
    month ? ['budgets', month] as const : ['budgets'] as const,

  // Notifications
  notifications: () => ['notifications']                 as const,
  unreadCount:   () => ['notifications', 'unread-count'] as const,

  // Dashboard — sem mês = prefixo para invalidar todos os meses
  dashboard: (month?: string) =>
    month ? ['dashboard', month] as const : ['dashboard'] as const,

  // Salary
  salary: {
    config: () => ['salary', 'config'] as const,
    status: () => ['salary', 'status'] as const,
  },
} as const

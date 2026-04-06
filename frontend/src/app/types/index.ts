import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// ── Row types (leitura do banco) ──────────────────────────────────────────────
export type Profile         = Tables<'profiles'>
export type Category        = Tables<'categories'>
export type Transaction     = Tables<'transactions'>
export type Goal            = Tables<'goals'>
export type GoalContribution= Tables<'goal_contributions'>
export type Budget          = Tables<'budgets'>
export type Notification    = Tables<'notifications'>
export type UserSettings    = Tables<'user_settings'>
export type AuditLog        = Tables<'audit_logs'>
export type SalaryConfig    = Tables<'salary_configs'>

// ── Insert types (criação) ────────────────────────────────────────────────────
export type TransactionInsert     = TablesInsert<'transactions'>
export type CategoryInsert        = TablesInsert<'categories'>
export type GoalInsert            = TablesInsert<'goals'>
export type GoalContributionInsert= TablesInsert<'goal_contributions'>
export type BudgetInsert          = TablesInsert<'budgets'>

// ── Update types (edição) ─────────────────────────────────────────────────────
export type ProfileUpdate         = TablesUpdate<'profiles'>
export type TransactionUpdate     = TablesUpdate<'transactions'>
export type GoalUpdate            = TablesUpdate<'goals'>
export type BudgetUpdate          = TablesUpdate<'budgets'>
export type UserSettingsUpdate    = TablesUpdate<'user_settings'>

// ── Enums derivados do schema ─────────────────────────────────────────────────
export type TransactionType   = 'income' | 'expense'
export type CategoryType      = 'income' | 'expense' | 'both'
export type GoalStatus        = 'active' | 'completed' | 'expired' | 'cancelled'
export type NotificationType  = 'success' | 'warning' | 'info' | 'goal' | 'alert'
export type UserPlan          = 'free' | 'premium'
export type RecurringInterval = 'weekly' | 'monthly' | 'yearly'

// ── Tipos compostos para UI ───────────────────────────────────────────────────
export type TransactionWithCategory = Transaction & {
  categories: Category | null
}

export type BudgetWithCategory = Budget & {
  categories: Category | null
}

export type GoalWithProgress = Goal & {
  progressPercent: number
  remaining: number
}

// ── Filtros de transações ─────────────────────────────────────────────────────
export interface TransactionFilters {
  type?: TransactionType | 'all'
  category_id?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  pageSize?: number
}

// ── Salary status (retorno do RPC get_salary_status) ─────────────────────────
export interface SalaryStatus {
  config_id:              string
  name:                   string
  salary_amount:          number
  gross_amount:           number | null
  inss_amount:            number
  irrf_amount:            number
  other_deductions:       number
  other_deductions_label: string | null
  tax_mode:               string
  payment_type:           string
  payment_split_percent:  number
  period_start:           string
  period_end:             string
  total_spent:            number
  remaining:              number
}

// ── Dashboard summary ─────────────────────────────────────────────────────────
export interface DashboardSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  incomeChange: number   // % vs mês anterior
  expenseChange: number
  balanceChange: number
}

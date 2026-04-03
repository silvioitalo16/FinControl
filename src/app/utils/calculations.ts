// ── Percentuais ───────────────────────────────────────────────────────────────
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / Math.abs(previous)) * 100)
}

// ── Progresso de metas ────────────────────────────────────────────────────────
export function calculateGoalProgress(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

export function calculateGoalRemaining(current: number, target: number): number {
  return Math.max(0, target - current)
}

// ── Orçamento ─────────────────────────────────────────────────────────────────
export function calculateBudgetUsagePercent(spent: number, planned: number): number {
  if (planned <= 0) return 0
  return Math.round((spent / planned) * 100)
}

export function isBudgetWarning(spent: number, planned: number): boolean {
  return calculateBudgetUsagePercent(spent, planned) >= 80
}

export function isBudgetExceeded(spent: number, planned: number): boolean {
  return spent > planned
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function calculateBalance(income: number, expenses: number): number {
  return income - expenses
}

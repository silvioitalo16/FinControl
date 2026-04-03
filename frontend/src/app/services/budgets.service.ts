import { supabase, getAuthUserId } from '@/app/lib/supabase'
import type { BudgetWithCategory } from '@/app/types'
import type { BudgetInput } from '@/app/validators/budget.schema'
import { toFirstDayOfMonth } from '@/app/utils/formatters'

export const budgetsService = {
  async getBudgets(month?: string): Promise<BudgetWithCategory[]> {
    const userId = getAuthUserId()
    const targetMonth = month ?? toFirstDayOfMonth()

    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(*)')
      .eq('user_id', userId)
      .eq('month', targetMonth)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as BudgetWithCategory[]
  },

  async createBudget(input: BudgetInput) {
    const userId = getAuthUserId()
    // Normaliza month para o 1º dia
    const month = toFirstDayOfMonth(new Date(input.month))
    const { data, error } = await supabase
      .from('budgets')
      .insert({ ...input, month, user_id: userId })
      .select('*, categories(*)')
      .single()
    if (error) throw error
    return data as BudgetWithCategory
  },

  async updateBudget(id: string, input: Partial<BudgetInput>) {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('budgets')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, categories(*)')
      .single()
    if (error) throw error
    return data as BudgetWithCategory
  },

  async deleteBudget(id: string): Promise<void> {
    const userId = getAuthUserId()
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  },
}

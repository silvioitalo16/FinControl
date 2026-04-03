import { supabase, getAuthUserId } from '@/app/lib/supabase'
import type { Goal, GoalContribution } from '@/app/types'
import type { GoalInput, GoalContributionInput } from '@/app/validators/goal.schema'

export const goalsService = {
  async getGoals(): Promise<Goal[]> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async createGoal(input: GoalInput): Promise<Goal> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateGoal(id: string, input: Partial<GoalInput>): Promise<Goal> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('goals')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteGoal(id: string): Promise<void> {
    const userId = getAuthUserId()
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  },

  async addContribution(goalId: string, input: GoalContributionInput): Promise<GoalContribution> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('goal_contributions')
      .insert({ ...input, goal_id: goalId, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getContributions(goalId: string): Promise<GoalContribution[]> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (error) throw error
    return data ?? []
  },
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { goalsService } from '@/app/services/goals.service'
import { QUERY_KEYS } from '@/app/config/queryKeys'
import type { GoalInput, GoalContributionInput } from '@/app/validators/goal.schema'

export function useGoals() {
  return useQuery({
    queryKey: QUERY_KEYS.goals(),
    queryFn: () => goalsService.getGoals(),
  })
}

export function useGoalContributions(goalId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.goalContributions(goalId),
    queryFn: () => goalsService.getContributions(goalId),
    enabled: !!goalId,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['goals', 'create'],
    mutationFn: (input: GoalInput) => goalsService.createGoal(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.goals() })
      toast.success('Meta criada com sucesso.')
    },
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['goals', 'update'],
    mutationFn: ({ id, input }: { id: string; input: Partial<GoalInput> }) =>
      goalsService.updateGoal(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.goals() })
      toast.success('Meta atualizada.')
    },
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['goals', 'delete'],
    mutationFn: (id: string) => goalsService.deleteGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.goals() })
      toast.success('Meta removida.')
    },
  })
}

export function useAddContribution() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['goals', 'contribution'],
    mutationFn: ({ goalId, input }: { goalId: string; input: GoalContributionInput }) =>
      goalsService.addContribution(goalId, input),
    onSuccess: (_, { goalId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.goals() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.goalContributions(goalId) })
      toast.success('Valor adicionado à meta.')
    },
  })
}

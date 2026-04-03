import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { budgetsService } from '@/app/services/budgets.service'
import { QUERY_KEYS } from '@/app/config/queryKeys'
import { toFirstDayOfMonth } from '@/app/utils/formatters'
import type { BudgetInput } from '@/app/validators/budget.schema'

export function useBudgets(month?: string) {
  const targetMonth = month ?? toFirstDayOfMonth()
  return useQuery({
    queryKey: QUERY_KEYS.budgets(targetMonth),
    queryFn: () => budgetsService.getBudgets(targetMonth),
  })
}

export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BudgetInput) => budgetsService.createBudget(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] })
      toast.success('Orçamento criado.')
    },
  })
}

export function useUpdateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BudgetInput> }) =>
      budgetsService.updateBudget(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] })
      toast.success('Orçamento atualizado.')
    },
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => budgetsService.deleteBudget(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] })
      toast.success('Orçamento removido.')
    },
  })
}

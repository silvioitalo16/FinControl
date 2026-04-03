import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { transactionsService } from '@/app/services/transactions.service'
import { QUERY_KEYS } from '@/app/config/queryKeys'
import type { TransactionFilters } from '@/app/types'
import type { TransactionInput } from '@/app/validators/transaction.schema'

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(filters),
    queryFn: () => transactionsService.getTransactions(filters),
  })
}

export function useMonthlySummary(month: string) {
  return useQuery({
    queryKey: QUERY_KEYS.transactionsSummary(month),
    queryFn: () => transactionsService.getMonthlySummary(month),
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TransactionInput) => transactionsService.createTransaction(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.transactions() })
      qc.invalidateQueries({ queryKey: ['transactions', 'summary'] })
      qc.invalidateQueries({ queryKey: ['budgets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['salary', 'status'] })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications() })
      toast.success('Transação adicionada.')
    },
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionInput> }) =>
      transactionsService.updateTransaction(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.transactions() })
      qc.invalidateQueries({ queryKey: ['transactions', 'summary'] })
      qc.invalidateQueries({ queryKey: ['budgets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transação atualizada.')
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transactionsService.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.transactions() })
      qc.invalidateQueries({ queryKey: ['transactions', 'summary'] })
      qc.invalidateQueries({ queryKey: ['budgets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transação removida.')
    },
  })
}

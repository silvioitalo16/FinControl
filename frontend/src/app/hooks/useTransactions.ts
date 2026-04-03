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

function invalidateAfterTransaction(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: QUERY_KEYS.transactions() })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.transactionsSummary() })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.budgets() })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.salary.status() })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications() })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['transactions', 'create'],
    mutationFn: (input: TransactionInput) => transactionsService.createTransaction(input),
    onSuccess: () => {
      invalidateAfterTransaction(qc)
      toast.success('Transação adicionada.')
    },
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['transactions', 'update'],
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionInput> }) =>
      transactionsService.updateTransaction(id, input),
    onSuccess: () => {
      invalidateAfterTransaction(qc)
      toast.success('Transação atualizada.')
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['transactions', 'delete'],
    mutationFn: (id: string) => transactionsService.deleteTransaction(id),
    onSuccess: () => {
      invalidateAfterTransaction(qc)
      toast.success('Transação removida.')
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { salaryService } from '@/app/services/salary.service'
import { QUERY_KEYS } from '@/app/config/queryKeys'
import type { SalaryInput } from '@/app/validators/salary.schema'

export function useSalaryConfig() {
  return useQuery({
    queryKey: QUERY_KEYS.salary.config(),
    queryFn: () => salaryService.getConfig(),
  })
}

export function useSalaryStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.salary.status(),
    queryFn: () => salaryService.getStatus(),
    staleTime: 0,
  })
}

export function useUpsertSalary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SalaryInput) => salaryService.upsertConfig(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.salary.config() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.salary.status() })
      toast.success('Configuração de salário salva.')
    },
  })
}

export function useDeleteSalary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => salaryService.deleteConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.salary.config() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.salary.status() })
      toast.success('Configuração de salário removida.')
    },
  })
}

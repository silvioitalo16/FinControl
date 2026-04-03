import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { salaryService } from '@/app/services/salary.service'
import type { SalaryInput } from '@/app/validators/salary.schema'

const SALARY_CONFIG_KEY  = ['salary', 'config']  as const
const SALARY_STATUS_KEY  = ['salary', 'status']  as const

export function useSalaryConfig() {
  return useQuery({
    queryKey: SALARY_CONFIG_KEY,
    queryFn:  () => salaryService.getConfig(),
  })
}

export function useSalaryStatus() {
  return useQuery({
    queryKey: SALARY_STATUS_KEY,
    queryFn:  () => salaryService.getStatus(),
    // Refresh quando uma nova transação for criada
    staleTime: 0,
  })
}

export function useUpsertSalary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SalaryInput) => salaryService.upsertConfig(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SALARY_CONFIG_KEY })
      qc.invalidateQueries({ queryKey: SALARY_STATUS_KEY })
      toast.success('Configuração de salário salva.')
    },
  })
}

export function useDeleteSalary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => salaryService.deleteConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SALARY_CONFIG_KEY })
      qc.invalidateQueries({ queryKey: SALARY_STATUS_KEY })
      toast.success('Configuração de salário removida.')
    },
  })
}

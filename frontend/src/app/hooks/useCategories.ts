import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { categoriesService } from '@/app/services/categories.service'
import { QUERY_KEYS } from '@/app/config/queryKeys'
import type { CategoryType, CategoryInsert } from '@/app/types'

export function useCategories(type?: CategoryType) {
  return useQuery({
    queryKey: [...QUERY_KEYS.categories(), { type }],
    queryFn: () => categoriesService.getCategories(type),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<CategoryInsert, 'user_id'>) =>
      categoriesService.createCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories() })
      toast.success('Categoria criada.')
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoriesService.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories() })
      toast.success('Categoria removida.')
    },
  })
}

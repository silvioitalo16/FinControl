import { QueryClient } from '@tanstack/react-query'
import { parseSupabaseError } from '@/app/utils/errors'
import { logger } from '@/app/lib/logger'
import { toast } from 'sonner'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 min: dados fresh, sem refetch desnecessário
      gcTime: 1000 * 60 * 30,    // 30 min no cache após unused
      retry: 1,                   // 1 retry (era 2) — falha mais rápido
      retryDelay: 1000,           // delay fixo de 1s (era exponencial até 30s)
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        const message = parseSupabaseError(error)
        logger.error('Mutation falhou', { message, raw: String(error) })
        toast.error(message)
      },
    },
  },
})

import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query'
import { parseSupabaseError } from '@/app/utils/errors'
import { logger } from '@/app/lib/logger'
import { toast } from 'sonner'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 min fresh
      gcTime: 1000 * 60 * 30,    // 30 min no cache
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
  },
  // Em TanStack Query v5, callbacks globais devem usar Cache — não defaultOptions
  queryCache: new QueryCache({
    onError: (error) => {
      logger.error('Query falhou', { message: String(error) })
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: (_data, _vars, _ctx, mutation) => {
      const key = mutation.options.mutationKey
      if (key) logger.info(`✅ ${String(key)}`)
    },
    onError: (error, _vars, _ctx, mutation) => {
      const message = parseSupabaseError(error)
      const key = mutation.options.mutationKey
      logger.error(`❌ ${String(key ?? 'mutation')} falhou`, { message, raw: String(error) })
      toast.error(message)
    },
  }),
})

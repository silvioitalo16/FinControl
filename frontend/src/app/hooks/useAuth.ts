import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { authService } from '@/app/services/auth.service'
import { profileService } from '@/app/services/profile.service'
import { transactionsService } from '@/app/services/transactions.service'
import { goalsService } from '@/app/services/goals.service'
import { categoriesService } from '@/app/services/categories.service'
import { useAuthStore } from '@/app/stores/auth.store'
import { useNotificationsStore } from '@/app/stores/notifications.store'
import { queryClient } from '@/app/lib/queryClient'
import { QUERY_KEYS } from '@/app/config/queryKeys'
import { ROUTES } from '@/app/config/routes'
import { toFirstDayOfMonth } from '@/app/utils/formatters'
import type { LoginInput, SignUpInput } from '@/app/validators/auth.schema'

function prefetchDashboard() {
  const month = toFirstDayOfMonth()
  queryClient.prefetchQuery({ queryKey: QUERY_KEYS.transactionsSummary(month), queryFn: () => transactionsService.getMonthlySummary(month) })
  queryClient.prefetchQuery({ queryKey: QUERY_KEYS.transactions({ pageSize: 5 }), queryFn: () => transactionsService.getTransactions({ pageSize: 5 }) })
  queryClient.prefetchQuery({ queryKey: QUERY_KEYS.goals(), queryFn: () => goalsService.getGoals() })
  queryClient.prefetchQuery({ queryKey: [...QUERY_KEYS.categories(), { type: 'expense' }], queryFn: () => categoriesService.getCategories('expense') })
}

// Inicializa listener de auth state — chamar uma vez em App.tsx
export function useAuthListener() {
  const { setUser, setSession, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    // Carrega sessão existente
    authService.getSession().then((session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escuta mudanças
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const profile = await profileService.getProfile()
          setProfile(profile)
          prefetchDashboard()
        } catch {
          // profile pode não existir ainda (signup, aguarda trigger)
        }
      }

      if (event === 'SIGNED_OUT') {
        reset()
        useNotificationsStore.getState().reset()
        queryClient.clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setProfile, setLoading, reset])
}

export function useSignIn() {
  const navigate = useNavigate()
  const { setProfile } = useAuthStore()

  return useMutation({
    mutationFn: (input: LoginInput) => authService.signIn(input),
    onSuccess: async () => {
      try {
        const profile = await profileService.getProfile()
        setProfile(profile)
      } catch { /* handled by auth listener */ }
      navigate(ROUTES.DASHBOARD)
    },
    onError: () => {
      toast.error('Email ou senha incorretos.')
    },
  })
}

export function useSignUp() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (input: SignUpInput) => authService.signUp(input),
    onSuccess: () => {
      toast.success('Enviamos um email de confirmação personalizado para o seu cadastro.')
      navigate(ROUTES.LOGIN)
    },
  })
}

export function useSignOut() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      qc.clear()
      navigate(ROUTES.LOGIN)
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.sendPasswordResetEmail(email),
    onSuccess: () => {
      toast.success('Email de recuperação enviado.')
    },
  })
}

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (newPassword: string) => authService.updatePassword(newPassword),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso.')
      navigate(ROUTES.LOGIN)
    },
  })
}

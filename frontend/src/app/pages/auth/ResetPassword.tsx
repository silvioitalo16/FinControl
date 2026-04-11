import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordInput } from '@/app/validators/auth.schema'
import { useResetPassword } from '@/app/hooks/useAuth'
import { supabase } from '@/app/lib/supabase'
import PasswordInput from '@/app/components/PasswordInput'

type SessionState = 'loading' | 'ready' | 'invalid'

export default function ResetPassword() {
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const { mutate: resetPassword, isPending } = useResetPassword()
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    // Supabase com flowType=pkce detecta o token na URL e dispara PASSWORD_RECOVERY
    // Precisamos aguardar esse evento antes de permitir updateUser
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionState('ready')
      } else if (event === 'SIGNED_IN' && session) {
        // Token já foi trocado em visita anterior à mesma URL
        setSessionState('ready')
      }
    })

    // Se já tem sessão ativa de recuperação, fica pronto imediatamente
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionState('ready')
    })

    // Timeout: se em 30s não vier sessão, o link é inválido/expirado
    const timeout = setTimeout(() => {
      setSessionState((prev) => prev === 'loading' ? 'invalid' : prev)
    }, 30_000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  if (sessionState === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Verificando link de recuperação...</p>
        </div>
      </div>
    )
  }

  if (sessionState === 'invalid') {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-bold">Link expirado</h1>
          <p className="text-sm text-muted-foreground">
            Este link de recuperação é inválido ou já expirou. Solicite um novo.
          </p>
          <a
            href="/forgot-password"
            className="inline-block w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Solicitar novo link
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Nova senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">Escolha uma nova senha segura.</p>
        </div>

        <form onSubmit={handleSubmit((data) => resetPassword(data.password))} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nova senha</label>
            <PasswordInput
              {...register('password')}
              placeholder="Mín. 8 caracteres"
            />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirmar senha</label>
            <PasswordInput
              {...register('confirmPassword')}
              placeholder="Repita a senha"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordInput } from '@/app/validators/auth.schema'
import { useResetPassword } from '@/app/hooks/useAuth'
import { supabase } from '@/app/lib/supabase'
import PasswordInput from '@/app/components/PasswordInput'

type SessionState = 'loading' | 'ready' | 'invalid'

const LINK_ERROR_MESSAGES: Record<string, string> = {
  otp_expired: 'Este link de recuperação expirou ou já foi utilizado. Solicite um novo.',
  access_denied: 'Link inválido. Solicite um novo.',
}

export default function ResetPassword() {
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [invalidReason, setInvalidReason] = useState<string | null>(null)
  const { mutate: resetPassword, isPending } = useResetPassword()
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    let cancelled = false

    function markInvalid(reason: string) {
      if (cancelled) return
      setInvalidReason(reason)
      setSessionState('invalid')
    }

    // 1) Primeiro parseia o fragmento manualmente — Supabase em modo PKCE não
    //    processa link implicit-flow (gerado via admin.generateLink no backend)
    //    e o onAuthStateChange pode disparar antes do mount (race). Então
    //    estabelecemos a sessão aqui diretamente.
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
    const params = new URLSearchParams(hash)
    const errorCode = params.get('error_code') ?? params.get('error')
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (errorCode) {
      markInvalid(LINK_ERROR_MESSAGES[errorCode] ?? 'Link inválido ou expirado. Solicite um novo.')
      // Limpa fragmento da URL (remove token/erro do histórico)
      window.history.replaceState(null, '', window.location.pathname)
      return () => {
        cancelled = true
      }
    }

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (cancelled) return
          if (error) {
            markInvalid('Não foi possível validar o link de recuperação. Solicite um novo.')
          } else {
            setSessionState('ready')
          }
          // Remove tokens do fragmento — não deixa credencial no histórico
          window.history.replaceState(null, '', window.location.pathname)
        })
      return () => {
        cancelled = true
      }
    }

    // 2) Fallback: sem fragmento (PKCE real, ou usuário já tem sessão ativa).
    //    Inscreve no auth state change e também verifica a sessão atual.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        setSessionState('ready')
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session) setSessionState('ready')
    })

    const timeout = setTimeout(() => {
      if (cancelled) return
      setSessionState((prev) => (prev === 'loading' ? 'invalid' : prev))
      setInvalidReason((prev) => prev ?? 'Link inválido ou expirado. Solicite um novo.')
    }, 8_000)

    return () => {
      cancelled = true
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
            {invalidReason ?? 'Este link de recuperação é inválido ou já expirou. Solicite um novo.'}
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
              autoComplete="new-password"
            />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirmar senha</label>
            <PasswordInput
              {...register('confirmPassword')}
              placeholder="Repita a senha"
              autoComplete="new-password"
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

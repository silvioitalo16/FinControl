import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { resetPasswordSchema, type ResetPasswordInput } from '@/app/validators/auth.schema'
import { parseSupabaseError } from '@/app/utils/errors'
import { ROUTES } from '@/app/config/routes'
import PasswordInput from '@/app/components/PasswordInput'

type SessionState = 'loading' | 'ready' | 'invalid'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const LINK_ERROR_MESSAGES: Record<string, string> = {
  otp_expired: 'Este link de recuperação expirou ou já foi utilizado. Solicite um novo.',
  access_denied: 'Link inválido. Solicite um novo.',
}

/** Decodifica o payload de um JWT sem validar assinatura — usado só pra
 *  checar `exp` localmente antes de mandar pra API. */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [invalidReason, setInvalidReason] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    // Fluxo manual: contorna o client Supabase (PKCE) que entra em conflito
    // com tokens implicit-flow gerados pelo backend via admin.generateLink.
    // Decodificamos o JWT local pra validar expiry e guardamos o token pra
    // usar direto no PUT /auth/v1/user no submit.
    //
    // IMPORTANTE: NÃO limpar o hash aqui. React Strict Mode monta o componente
    // duas vezes em dev — se limpássemos na primeira, a segunda montagem
    // encontraria hash vazio e marcaria como inválido. O hash só é removido
    // depois do submit bem-sucedido.
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
    const params = new URLSearchParams(hash)
    const errorCode = params.get('error_code') ?? params.get('error')
    const token = params.get('access_token')

    if (errorCode) {
      setInvalidReason(LINK_ERROR_MESSAGES[errorCode] ?? 'Link inválido ou expirado. Solicite um novo.')
      setSessionState('invalid')
      return
    }

    if (!token) {
      setInvalidReason('Link inválido. Solicite um novo.')
      setSessionState('invalid')
      return
    }

    const payload = decodeJwtPayload(token)
    if (!payload || typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
      setInvalidReason('Este link de recuperação expirou. Solicite um novo.')
      setSessionState('invalid')
      return
    }

    setAccessToken(token)
    setSessionState('ready')
  }, [])

  async function onSubmit(data: ResetPasswordInput) {
    if (!accessToken || isPending) return
    setIsPending(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password: data.password }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { msg?: string; error_description?: string; message?: string }
        const rawMessage = body.msg ?? body.error_description ?? body.message ?? 'Não foi possível alterar a senha.'
        throw new Error(rawMessage)
      }

      // Remove token do histórico depois do sucesso
      window.history.replaceState(null, '', window.location.pathname)
      toast.success('Senha alterada com sucesso.')
      navigate(ROUTES.LOGIN)
    } catch (error) {
      toast.error(parseSupabaseError(error))
    } finally {
      setIsPending(false)
    }
  }

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

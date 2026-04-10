import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/app/validators/auth.schema'
import { useForgotPassword } from '@/app/hooks/useAuth'
import { ROUTES } from '@/app/config/routes'
import TurnstileWidget from '@/app/components/TurnstileWidget'

export default function ForgotPassword() {
  const { mutate: sendReset, isPending, isSuccess } = useForgotPassword()
  const [turnstileToken, setTurnstileToken] = useState<string>()
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  if (isSuccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl">✉️</div>
          <h2 className="text-xl font-semibold">Email enviado!</h2>
          <p className="text-sm text-muted-foreground">Verifique sua caixa de entrada e siga as instruções.</p>
          <Link to={ROUTES.LOGIN} className="block text-sm text-primary hover:underline">Voltar ao login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Recuperar senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe seu email e enviaremos um link de recuperação.
          </p>
        </div>

        <form onSubmit={handleSubmit((data) => sendReset({ email: data.email, turnstileToken }))} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <TurnstileWidget
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(undefined)}
          />

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        <p className="text-center text-sm">
          <Link to={ROUTES.LOGIN} className="text-primary hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </div>
  )
}

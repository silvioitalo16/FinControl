import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordInput } from '@/app/validators/auth.schema'
import { useResetPassword } from '@/app/hooks/useAuth'

export default function ResetPassword() {
  const { mutate: resetPassword, isPending } = useResetPassword()
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

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
            <input
              {...register('password')}
              type="password"
              placeholder="Mín. 8 caracteres"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirmar senha</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Repita a senha"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm outline-none focus:border-primary"
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

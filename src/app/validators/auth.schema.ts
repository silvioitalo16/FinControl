import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido.').toLowerCase().trim(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.'),
})

export const signUpSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.').max(100).trim(),
  email: z.string().email('Email inválido.').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número.'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'As senhas não conferem.', path: ['confirmPassword'] }
)

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido.').toLowerCase().trim(),
})

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número.'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'As senhas não conferem.', path: ['confirmPassword'] }
)

export type LoginInput        = z.infer<typeof loginSchema>
export type SignUpInput        = z.infer<typeof signUpSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput  = z.infer<typeof resetPasswordSchema>

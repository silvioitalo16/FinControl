import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.').max(100).trim(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{8,20}$/, 'Telefone inválido.')
    .optional()
    .or(z.literal('')),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.').optional().or(z.literal('')),
  location: z.string().max(100).trim().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória.'),
  newPassword: z
    .string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'Deve conter pelo menos um número.'),
  confirmNewPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmNewPassword,
  { message: 'As senhas não conferem.', path: ['confirmNewPassword'] }
).refine(
  (data) => data.newPassword !== data.currentPassword,
  { message: 'A nova senha deve ser diferente da atual.', path: ['newPassword'] }
)

export type ProfileInput        = z.infer<typeof profileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

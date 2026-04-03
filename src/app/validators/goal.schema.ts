import { z } from 'zod'

export const goalSchema = z.object({
  name: z.string().min(3, 'Nome muito curto.').max(100).trim(),
  target_amount: z
    .number({ invalid_type_error: 'Valor deve ser um número.' })
    .positive('Valor deve ser positivo.')
    .max(999_999_999.99),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.').optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida.').default('#10b981'),
  icon: z.string().default('Target'),
})

export const goalContributionSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Valor deve ser um número.' })
    .positive('Valor deve ser positivo.')
    .max(999_999_999.99),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(
    () => new Date().toISOString().split('T')[0]
  ),
  notes: z.string().max(500).trim().optional(),
})

export type GoalInput             = z.infer<typeof goalSchema>
export type GoalContributionInput = z.infer<typeof goalContributionSchema>

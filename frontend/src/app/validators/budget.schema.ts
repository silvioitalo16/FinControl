import { z } from 'zod'
import { toFirstDayOfMonth } from '@/app/utils/formatters'

export const budgetSchema = z.object({
  category_id: z.string().uuid('Categoria inválida.'),
  planned_amount: z
    .number({ invalid_type_error: 'Valor deve ser um número.' })
    .positive('Valor deve ser positivo.')
    .max(999_999_999.99),
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Mês inválido.').default(
    () => toFirstDayOfMonth()
  ),
})

export type BudgetInput = z.infer<typeof budgetSchema>

import { z } from 'zod'
import { MAX_TRANSACTION_AMOUNT } from '@/app/config/constants'

export const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição muito curta.').max(100).trim(),
  amount: z
    .number({ invalid_type_error: 'Valor deve ser um número.' })
    .positive('Valor deve ser positivo.')
    .max(MAX_TRANSACTION_AMOUNT, 'Valor muito alto.'),
  type: z.enum(['income', 'expense'], { message: 'Tipo inválido.' }),
  category_id: z.string().uuid('Categoria inválida.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  notes: z.string().max(500).trim().optional(),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  recurring_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  (data) => !data.is_recurring || !!data.recurring_interval,
  { message: 'Selecione o intervalo de recorrência.', path: ['recurring_interval'] }
)

export type TransactionInput = z.infer<typeof transactionSchema>

import { z } from 'zod'
import { format } from 'date-fns'

export const salarySchema = z
  .object({
    name:                   z.string().min(1, 'Nome obrigatório.').max(60).trim(),
    tax_mode:               z.enum(['net', 'gross_auto', 'gross_manual']),
    amount:                 z.number({ invalid_type_error: 'Valor inválido.' }).positive('Valor deve ser positivo.').optional(),
    gross_amount:           z.number({ invalid_type_error: 'Valor inválido.' }).positive('Valor deve ser positivo.').optional(),
    inss_amount:            z.number({ invalid_type_error: 'Valor inválido.' }).min(0).optional(),
    irrf_amount:            z.number({ invalid_type_error: 'Valor inválido.' }).min(0).optional(),
    other_deductions:       z.number().min(0).default(0),
    other_deductions_label: z.string().max(60).trim().nullable().optional(),
    payment_type:           z.enum(['monthly', 'biweekly', 'custom']),
    payment_day:            z.number().int().min(1).max(31, 'Dia inválido.').optional(),
    payment_day_2:          z.number().int().min(1).max(31, 'Dia inválido.').optional(),
    payment_split_percent:       z.number().int().min(1).max(99).default(50),
    payment_fixed_first_amount:  z.number().positive().optional().nullable(),
    custom_interval_days:   z.number().int().min(1, 'Intervalo deve ser pelo menos 1 dia.').optional(),
    custom_start_date:      z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
      .optional()
      .default(() => format(new Date(), 'yyyy-MM-dd')),
  })
  .superRefine((data, ctx) => {
    // Payment type
    if (data.payment_type === 'monthly' || data.payment_type === 'biweekly') {
      if (!data.payment_day) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Dia de pagamento obrigatório.', path: ['payment_day'] })
      }
    }
    if (data.payment_type === 'biweekly' && !data.payment_day_2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '2º dia de pagamento obrigatório.', path: ['payment_day_2'] })
    }
    if (data.payment_type === 'custom') {
      if (!data.custom_interval_days) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Intervalo obrigatório.', path: ['custom_interval_days'] })
      }
      if (!data.custom_start_date) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data do primeiro pagamento obrigatória.', path: ['custom_start_date'] })
      }
    }
    // Tax mode
    if (data.tax_mode === 'net' && (!data.amount || data.amount <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Salário líquido obrigatório.', path: ['amount'] })
    }
    if ((data.tax_mode === 'gross_auto' || data.tax_mode === 'gross_manual') && (!data.gross_amount || data.gross_amount <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Salário bruto obrigatório.', path: ['gross_amount'] })
    }
    if (data.tax_mode === 'gross_manual') {
      if (data.inss_amount === undefined || data.inss_amount === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valor do INSS obrigatório.', path: ['inss_amount'] })
      }
      if (data.irrf_amount === undefined || data.irrf_amount === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valor do IRRF obrigatório.', path: ['irrf_amount'] })
      }
    }
  })

export type SalaryInput = z.infer<typeof salarySchema>

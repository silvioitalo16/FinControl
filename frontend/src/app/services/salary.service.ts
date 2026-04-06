import { supabase, getAuthUserId } from '@/app/lib/supabase'
import type { SalaryConfig, SalaryStatus } from '@/app/types'
import type { SalaryInput } from '@/app/validators/salary.schema'

// ── Tabela progressiva INSS 2024 ─────────────────────────────────────────────
export function calculateINSSBR(gross: number): number {
  const bands = [
    { limit: 1412.00, rate: 0.075 },
    { limit: 2666.68, rate: 0.09  },
    { limit: 4000.03, rate: 0.12  },
    { limit: 7786.02, rate: 0.14  },
  ]
  let inss = 0
  let prev = 0
  for (const band of bands) {
    if (gross <= prev) break
    inss += (Math.min(gross, band.limit) - prev) * band.rate
    prev = band.limit
  }
  return Math.round(inss * 100) / 100
}

// ── Tabela progressiva IRRF 2024 (base = bruto − INSS) ───────────────────────
export function calculateIRRFBR(base: number): number {
  if (base <= 2259.20) return 0
  if (base <= 2826.65) return Math.max(0, Math.round((base * 0.075 - 169.44) * 100) / 100)
  if (base <= 3751.05) return Math.max(0, Math.round((base * 0.15  - 381.44) * 100) / 100)
  if (base <= 4664.68) return Math.max(0, Math.round((base * 0.225 - 662.77) * 100) / 100)
  return Math.max(0, Math.round((base * 0.275 - 896.00) * 100) / 100)
}

export const salaryService = {
  async getConfig(): Promise<SalaryConfig | null> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('salary_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async upsertConfig(input: SalaryInput): Promise<SalaryConfig> {
    const userId = getAuthUserId()

    const gross = input.gross_amount ?? 0
    const otherDeductions = input.other_deductions ?? 0

    let inss = input.inss_amount ?? 0
    let irrf = input.irrf_amount ?? 0
    let netAmount = input.amount ?? 0

    if (input.tax_mode === 'gross_auto') {
      inss = calculateINSSBR(gross)
      irrf = calculateIRRFBR(gross - inss)
      netAmount = Math.max(0, gross - inss - irrf - otherDeductions)
    } else if (input.tax_mode === 'gross_manual') {
      netAmount = Math.max(0, gross - inss - irrf - otherDeductions)
    }

    // Desativa config existente
    await supabase
      .from('salary_configs')
      .update({ active: false })
      .eq('user_id', userId)
      .eq('active', true)

    const { data, error } = await supabase
      .from('salary_configs')
      .insert({
        user_id:                userId,
        active:                 true,
        name:                   input.name,
        tax_mode:               input.tax_mode,
        amount:                 netAmount,
        gross_amount:           gross > 0 ? gross : null,
        inss_amount:            inss,
        irrf_amount:            irrf,
        other_deductions:       otherDeductions,
        other_deductions_label: input.other_deductions_label ?? null,
        payment_type:           input.payment_type,
        payment_day:            input.payment_day            ?? null,
        payment_day_2:          input.payment_day_2          ?? null,
        payment_split_percent:       input.payment_split_percent,
        payment_fixed_first_amount:  input.payment_fixed_first_amount ?? null,
        custom_interval_days:        input.custom_interval_days       ?? null,
        custom_start_date:           input.custom_start_date          ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteConfig(id: string): Promise<void> {
    const userId = getAuthUserId()
    const { error } = await supabase
      .from('salary_configs')
      .update({ active: false })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  },

  async getStatus(): Promise<SalaryStatus | null> {
    const { data, error } = await supabase.rpc('get_salary_status')
    if (error) throw error
    return data as SalaryStatus | null
  },
}

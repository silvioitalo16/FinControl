import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X, Trash2, Edit2, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Wallet, Settings2 } from 'lucide-react'
import { format, addMonths, subMonths, parseISO, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/app/hooks/useBudgets'
import { useCategories } from '@/app/hooks/useCategories'
import { useSalaryConfig, useSalaryStatus, useUpsertSalary, useDeleteSalary } from '@/app/hooks/useSalary'
import { budgetSchema, type BudgetInput } from '@/app/validators/budget.schema'
import { salarySchema, type SalaryInput } from '@/app/validators/salary.schema'
import { calculateINSSBR, calculateIRRFBR } from '@/app/services/salary.service'
import { formatCurrency, toFirstDayOfMonth } from '@/app/utils/formatters'
import { calculateBudgetUsagePercent, isBudgetWarning, isBudgetExceeded } from '@/app/utils/calculations'
import type { BudgetWithCategory } from '@/app/types'

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  monthly:  'Mensal',
  biweekly: 'Quinzenal',
  custom:   'Personalizado',
}

function SalaryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: config } = useSalaryConfig()
  const upsert = useUpsertSalary()
  const deleteSalary = useDeleteSalary()

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<SalaryInput>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      name: 'Salário', tax_mode: 'net', payment_type: 'monthly',
      payment_day: 5, payment_split_percent: 50, other_deductions: 0,
    },
  })

  const paymentType     = watch('payment_type')
  const taxMode         = watch('tax_mode')
  const grossAmount     = watch('gross_amount')     ?? 0
  const inssAmount      = watch('inss_amount')      ?? 0
  const irrfAmount      = watch('irrf_amount')      ?? 0
  const otherDeductions = watch('other_deductions') ?? 0
  const netAmount       = watch('amount')           ?? 0
  const splitPercent    = watch('payment_split_percent') ?? 50

  const autoInss = taxMode === 'gross_auto' ? calculateINSSBR(grossAmount) : inssAmount
  const autoIrrf = taxMode === 'gross_auto' ? calculateIRRFBR(grossAmount - autoInss) : irrfAmount
  const previewNet = taxMode === 'net'
    ? netAmount
    : Math.max(0, grossAmount - autoInss - autoIrrf - otherDeductions)

  useEffect(() => {
    if (open && config) {
      reset({
        name:                   config.name,
        tax_mode:               (config.tax_mode as SalaryInput['tax_mode']) ?? 'net',
        amount:                 config.tax_mode === 'net' ? config.amount : undefined,
        gross_amount:           config.gross_amount    ?? undefined,
        inss_amount:            config.inss_amount,
        irrf_amount:            config.irrf_amount,
        other_deductions:       config.other_deductions,
        other_deductions_label: config.other_deductions_label ?? undefined,
        payment_type:           config.payment_type as SalaryInput['payment_type'],
        payment_day:            config.payment_day           ?? undefined,
        payment_day_2:          config.payment_day_2         ?? undefined,
        payment_split_percent:  config.payment_split_percent,
        custom_interval_days:   config.custom_interval_days  ?? undefined,
        custom_start_date:      config.custom_start_date     ?? undefined,
      })
    } else if (open && !config) {
      reset({ name: 'Salário', tax_mode: 'net', payment_type: 'monthly', payment_day: 5, payment_split_percent: 50, other_deductions: 0 })
    }
  }, [open, config, reset])

  async function onSubmit(data: SalaryInput) {
    await upsert.mutateAsync(data)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Configurar Salário</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Fonte</label>
            <input
              {...register('name')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Empresa Principal"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Modo tributação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modo de tributação</label>
            <select
              {...register('tax_mode')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="net">Salário líquido (já descontado)</option>
              <option value="gross_auto">Salário bruto — calcular INSS + IRRF automaticamente</option>
              <option value="gross_manual">Salário bruto — informar descontos manualmente</option>
            </select>
          </div>

          {/* Líquido */}
          {taxMode === 'net' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor líquido (R$)</label>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number" step="0.01" min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0,00"
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
            </div>
          )}

          {/* Bruto */}
          {(taxMode === 'gross_auto' || taxMode === 'gross_manual') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salário bruto (R$)</label>
              <input
                {...register('gross_amount', { valueAsNumber: true })}
                type="number" step="0.01" min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0,00"
              />
              {errors.gross_amount && <p className="text-xs text-red-500 mt-1">{errors.gross_amount.message}</p>}
            </div>
          )}

          {/* Descontos manuais */}
          {taxMode === 'gross_manual' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">INSS (R$)</label>
                <input
                  {...register('inss_amount', { valueAsNumber: true })}
                  type="number" step="0.01" min="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0,00"
                />
                {errors.inss_amount && <p className="text-xs text-red-500 mt-1">{errors.inss_amount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IRRF (R$)</label>
                <input
                  {...register('irrf_amount', { valueAsNumber: true })}
                  type="number" step="0.01" min="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0,00"
                />
                {errors.irrf_amount && <p className="text-xs text-red-500 mt-1">{errors.irrf_amount.message}</p>}
              </div>
            </div>
          )}

          {/* Outros descontos */}
          {(taxMode === 'gross_auto' || taxMode === 'gross_manual') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outros descontos (R$)</label>
                <input
                  {...register('other_deductions', { valueAsNumber: true })}
                  type="number" step="0.01" min="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  {...register('other_deductions_label')}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Vale transporte"
                />
              </div>
            </div>
          )}

          {/* Preview auto */}
          {taxMode === 'gross_auto' && grossAmount > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm space-y-1.5">
              <p className="text-xs font-semibold text-emerald-700 mb-2">Estimativa de descontos (tabela 2024)</p>
              <div className="flex justify-between text-gray-600">
                <span>INSS</span>
                <span className="font-medium text-red-500">− {formatCurrency(autoInss)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IRRF</span>
                <span className="font-medium text-red-500">− {formatCurrency(autoIrrf)}</span>
              </div>
              {otherDeductions > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Outros descontos</span>
                  <span className="font-medium text-red-500">− {formatCurrency(otherDeductions)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-800 pt-1.5 border-t border-emerald-200">
                <span>Líquido estimado</span>
                <span className="text-emerald-700">{formatCurrency(previewNet)}</span>
              </div>
            </div>
          )}

          {/* Preview manual */}
          {taxMode === 'gross_manual' && grossAmount > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>INSS</span>
                <span className="font-medium text-red-500">− {formatCurrency(inssAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IRRF</span>
                <span className="font-medium text-red-500">− {formatCurrency(irrfAmount)}</span>
              </div>
              {otherDeductions > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Outros descontos</span>
                  <span className="font-medium text-red-500">− {formatCurrency(otherDeductions)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-800 pt-1.5 border-t border-blue-200">
                <span>Líquido</span>
                <span className="text-blue-700">{formatCurrency(previewNet)}</span>
              </div>
            </div>
          )}

          {/* Tipo de pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pagamento</label>
            <select
              {...register('payment_type')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="monthly">Mensal (uma vez por mês)</option>
              <option value="biweekly">Quinzenal (duas vezes por mês)</option>
              <option value="custom">Personalizado (intervalo em dias)</option>
            </select>
          </div>

          {(paymentType === 'monthly' || paymentType === 'biweekly') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {paymentType === 'biweekly' ? '1º dia de pagamento' : 'Dia de pagamento'}
              </label>
              <input
                {...register('payment_day', { valueAsNumber: true })}
                type="number" min="1" max="31"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: 5"
              />
              {errors.payment_day && <p className="text-xs text-red-500 mt-1">{errors.payment_day.message}</p>}
            </div>
          )}

          {paymentType === 'biweekly' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">2º dia de pagamento</label>
                <input
                  {...register('payment_day_2', { valueAsNumber: true })}
                  type="number" min="1" max="31"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 20"
                />
                {errors.payment_day_2 && <p className="text-xs text-red-500 mt-1">{errors.payment_day_2.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Divisão quinzenal — 1º:{' '}
                  <span className="text-emerald-600 font-bold">{splitPercent}%</span>
                  {' '}/ 2º:{' '}
                  <span className="text-emerald-600 font-bold">{100 - splitPercent}%</span>
                </label>
                <input
                  {...register('payment_split_percent', { valueAsNumber: true })}
                  type="range" min="1" max="99"
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1º pagamento: {formatCurrency(previewNet * splitPercent / 100)}</span>
                  <span>2º pagamento: {formatCurrency(previewNet * (100 - splitPercent) / 100)}</span>
                </div>
              </div>
            </>
          )}

          {paymentType === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo (dias)</label>
                <input
                  {...register('custom_interval_days', { valueAsNumber: true })}
                  type="number" min="1"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 30"
                />
                {errors.custom_interval_days && <p className="text-xs text-red-500 mt-1">{errors.custom_interval_days.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do primeiro pagamento</label>
                <input
                  {...register('custom_start_date')}
                  type="date"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {errors.custom_start_date && <p className="text-xs text-red-500 mt-1">{errors.custom_start_date.message}</p>}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {config && (
              <button
                type="button"
                onClick={() => { deleteSalary.mutate(config.id); onClose() }}
                className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50"
              >
                Remover
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={upsert.isPending}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-60 text-sm"
            >
              {upsert.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SalaryWidget() {
  const [modalOpen, setModalOpen] = useState(false)
  const { data: status, isLoading } = useSalaryStatus()
  const { data: config } = useSalaryConfig()

  if (isLoading) return null

  if (!config || !status) {
    return (
      <>
        <div
          onClick={() => setModalOpen(true)}
          className="bg-white rounded-2xl p-5 shadow-sm border border-dashed border-emerald-300 flex items-center gap-4 cursor-pointer hover:bg-emerald-50 transition-colors mb-6"
        >
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-700 text-sm">Configurar salário</p>
            <p className="text-xs text-gray-400">Acompanhe quanto do seu salário já foi gasto no período</p>
          </div>
          <Plus className="w-5 h-5 text-emerald-500 ml-auto flex-shrink-0" />
        </div>
        <SalaryModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    )
  }

  const pct = Math.min(100, (status.total_spent / status.salary_amount) * 100)
  const exceeded = status.remaining < 0
  const warning  = !exceeded && pct >= 80
  const barColor = exceeded ? '#ef4444' : warning ? '#f59e0b' : '#10b981'

  const periodEnd = parseISO(status.period_end)
  const daysLeft = formatDistanceToNow(periodEnd, { locale: ptBR, addSuffix: true })

  return (
    <>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${exceeded ? 'bg-red-100' : warning ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              <Wallet className={`w-5 h-5 ${exceeded ? 'text-red-600' : warning ? 'text-amber-600' : 'text-emerald-600'}`} />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{status.name}</p>
              <p className="text-xs text-gray-400">
                {PAYMENT_TYPE_LABELS[status.payment_type]} · vence {daysLeft}
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-emerald-600"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Salário</p>
            <p className="text-sm font-bold text-gray-800">{formatCurrency(status.salary_amount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Gasto</p>
            <p className="text-sm font-bold text-red-600">{formatCurrency(status.total_spent)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{exceeded ? 'Excedente' : 'Disponível'}</p>
            <p className={`text-sm font-bold ${exceeded ? 'text-red-600' : 'text-emerald-600'}`}>
              {exceeded ? '- ' : ''}{formatCurrency(Math.abs(status.remaining))}
            </p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1.5">
          <div
            className="h-2.5 rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-xs font-semibold" style={{ color: barColor }}>
            {pct.toFixed(0)}% consumido
          </span>
          {exceeded && (
            <span className="text-xs text-red-600 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Salário esgotado
            </span>
          )}
          {warning && !exceeded && (
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Atenção
            </span>
          )}
          {!warning && !exceeded && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> OK
            </span>
          )}
        </div>
      </div>
      <SalaryModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}

function BudgetModal({
  open,
  onClose,
  month,
  editData,
}: {
  open: boolean
  onClose: () => void
  month: string
  editData?: BudgetWithCategory | null
}) {
  const { data: categories } = useCategories('expense')
  const createMutation = useCreateBudget()
  const updateMutation = useUpdateBudget()
  const isEdit = !!editData

  const { register, handleSubmit, formState: { errors } } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: editData
      ? { category_id: editData.category_id, planned_amount: editData.planned_amount, month: editData.month }
      : { month },
  })

  async function onSubmit(data: BudgetInput) {
    if (isEdit) {
      await updateMutation.mutateAsync({ id: editData!.id, input: data })
    } else {
      await createMutation.mutateAsync(data)
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{isEdit ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              {...register('category_id')}
              disabled={isEdit}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
            >
              <option value="">Selecionar...</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor planejado (R$)</label>
            <input
              {...register('planned_amount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0,00"
            />
            {errors.planned_amount && <p className="text-xs text-red-500 mt-1">{errors.planned_amount.message}</p>}
          </div>

          <input type="hidden" {...register('month')} />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-60 text-sm"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Planning() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BudgetWithCategory | null>(null)

  const month = toFirstDayOfMonth(currentDate)
  const { data: budgets, isLoading } = useBudgets(month)
  const deleteMutation = useDeleteBudget()

  const monthLabel = format(parseISO(month), 'MMMM yyyy', { locale: ptBR })
    .replace(/^\w/, (c) => c.toUpperCase())

  const totalPlanned = (budgets ?? []).reduce((s, b) => s + b.planned_amount, 0)
  const totalSpent   = (budgets ?? []).reduce((s, b) => s + b.spent_amount, 0)
  const totalRemaining = Math.max(0, totalPlanned - totalSpent)

  function openEdit(b: BudgetWithCategory) {
    setEditTarget(b)
    setModalOpen(true)
  }

  function openNew() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditTarget(null)
  }

  function handleDelete(id: string) {
    if (confirm('Remover este orçamento?')) deleteMutation.mutate(id)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <SalaryWidget />

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate((d) => subMonths(d, 1))}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-bold text-gray-800 min-w-[160px] text-center">{monthLabel}</h3>
          <button
            onClick={() => setCurrentDate((d) => addMonths(d, 1))}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <button
          onClick={openNew}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Planejado</p>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(totalPlanned)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Gasto</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Disponível</p>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalRemaining)}</p>
        </div>
      </div>

      {/* Budget list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : (budgets ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16 text-gray-500 text-sm">
          <p>Nenhum orçamento para este mês.</p>
          <button onClick={openNew} className="mt-3 text-emerald-600 font-medium hover:underline">
            Criar primeiro orçamento
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {(budgets as BudgetWithCategory[]).map((budget) => {
            const pct = calculateBudgetUsagePercent(budget.spent_amount, budget.planned_amount)
            const warning = isBudgetWarning(budget.spent_amount, budget.planned_amount)
            const exceeded = isBudgetExceeded(budget.spent_amount, budget.planned_amount)
            const barColor = exceeded ? '#ef4444' : warning ? '#f59e0b' : '#10b981'

            return (
              <div key={budget.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {budget.categories && (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${budget.categories.color ?? '#6b7280'}20` }}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.categories.color ?? '#6b7280' }} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{budget.categories?.name ?? 'Categoria'}</p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(budget.spent_amount)} de {formatCurrency(budget.planned_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {exceeded ? (
                      <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">
                        <AlertTriangle className="w-3 h-3" /> Excedido
                      </span>
                    ) : warning ? (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium">
                        <AlertTriangle className="w-3 h-3" /> Atenção
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                        <CheckCircle2 className="w-3 h-3" /> OK
                      </span>
                    )}
                    <button onClick={() => openEdit(budget)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-emerald-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(budget.id)} disabled={deleteMutation.isPending} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs font-semibold" style={{ color: barColor }}>{pct.toFixed(0)}% usado</span>
                  <span className="text-xs text-gray-400">
                    {exceeded
                      ? `excedeu em ${formatCurrency(budget.spent_amount - budget.planned_amount)}`
                      : `sobram ${formatCurrency(budget.planned_amount - budget.spent_amount)}`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BudgetModal open={modalOpen} onClose={handleClose} month={month} editData={editTarget} />
    </div>
  )
}

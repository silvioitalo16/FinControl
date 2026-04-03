import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Target, Trash2, Edit2, X, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useAddContribution } from '@/app/hooks/useGoals'
import { goalSchema, goalContributionSchema, type GoalInput, type GoalContributionInput } from '@/app/validators/goal.schema'
import { formatCurrency, formatDate } from '@/app/utils/formatters'
import { calculateGoalProgress } from '@/app/utils/calculations'
import type { Goal } from '@/app/types'

const today = format(new Date(), 'yyyy-MM-dd')

const GOAL_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
]

function GoalModal({
  open,
  onClose,
  editData,
}: {
  open: boolean
  onClose: () => void
  editData?: Goal | null
}) {
  const createMutation = useCreateGoal()
  const updateMutation = useUpdateGoal()
  const isEdit = !!editData

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: { color: '#10b981', icon: 'Target' },
  })

  useEffect(() => {
    if (open) {
      reset(editData
        ? {
            name: editData.name,
            target_amount: editData.target_amount,
            deadline: editData.deadline ?? undefined,
            color: editData.color ?? '#10b981',
            icon: editData.icon ?? 'Target',
          }
        : { color: '#10b981', icon: 'Target' }
      )
    }
  }, [open, editData, reset])

  const selectedColor = watch('color')

  async function onSubmit(data: GoalInput) {
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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{isEdit ? 'Editar Meta' : 'Nova Meta'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da meta</label>
            <input
              {...register('name')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Viagem Europa"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor alvo (R$)</label>
            <input
              {...register('target_amount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0,00"
            />
            {errors.target_amount && <p className="text-xs text-red-500 mt-1">{errors.target_amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (opcional)</label>
            <input
              {...register('deadline')}
              type="date"
              min={today}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className={`w-8 h-8 rounded-full transition-all ${selectedColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 text-sm"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ContributionModal({
  open,
  onClose,
  goal,
}: {
  open: boolean
  onClose: () => void
  goal: Goal | null
}) {
  const addContribution = useAddContribution()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GoalContributionInput>({
    resolver: zodResolver(goalContributionSchema),
    defaultValues: { date: today },
  })

  async function onSubmit(data: GoalContributionInput) {
    if (!goal) return
    await addContribution.mutateAsync({ goalId: goal.id, input: data })
    reset()
    onClose()
  }

  if (!open || !goal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Adicionar valor</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <p className="text-sm text-gray-500">Meta: <span className="font-semibold text-gray-800">{goal.name}</span></p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0,00"
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              {...register('date')}
              type="date"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <input
              {...register('notes')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Observação..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={addContribution.isPending}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-60 text-sm"
            >
              {addContribution.isPending ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  completed: 'Concluída',
  expired: 'Expirada',
  cancelled: 'Cancelada',
}

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-blue-50 text-blue-700',
  expired: 'bg-red-50 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function Goals() {
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Goal | null>(null)
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null)

  const { data: goals, isLoading } = useGoals()
  const deleteMutation = useDeleteGoal()

  const activeGoals = (goals ?? []).filter((g) => g.status === 'active')
  const completedGoals = (goals ?? []).filter((g) => g.status === 'completed')
  const totalSaved = (goals ?? []).reduce((s, g) => s + g.current_amount, 0)

  function openEdit(g: Goal) {
    setEditTarget(g)
    setGoalModalOpen(true)
  }

  function openNew() {
    setEditTarget(null)
    setGoalModalOpen(true)
  }

  function handleDelete(id: string) {
    if (confirm('Remover esta meta?')) deleteMutation.mutate(id)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-xl"><Target className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-sm text-gray-500">Metas ativas</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{activeGoals.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-xl"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
            <span className="text-sm text-gray-500">Total economizado</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalSaved)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-xl"><CheckCircle2 className="w-5 h-5 text-purple-600" /></div>
            <span className="text-sm text-gray-500">Concluídas</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{completedGoals.length}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Suas Metas</h3>
        <button
          onClick={openNew}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      {/* Goals list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : (goals ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16 text-gray-500 text-sm">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>Nenhuma meta criada ainda.</p>
          <button onClick={openNew} className="mt-3 text-emerald-600 font-medium hover:underline">
            Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(goals ?? []).map((goal) => {
            const progress = calculateGoalProgress(goal.current_amount, goal.target_amount)
            const remaining = Math.max(0, goal.target_amount - goal.current_amount)

            return (
              <div key={goal.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${goal.color ?? '#10b981'}20` }}>
                      <Target className="w-5 h-5" style={{ color: goal.color ?? '#10b981' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm leading-tight">{goal.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[goal.status ?? 'active']}`}>
                        {STATUS_LABELS[goal.status ?? 'active']}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {goal.status === 'active' && (
                      <button onClick={() => openEdit(goal)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-emerald-600">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(goal.id)} disabled={deleteMutation.isPending} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{formatCurrency(goal.current_amount)}</span>
                    <span>{formatCurrency(goal.target_amount)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, progress)}%`, backgroundColor: goal.color ?? '#10b981' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs font-semibold" style={{ color: goal.color ?? '#10b981' }}>{progress.toFixed(0)}%</span>
                    <span className="text-xs text-gray-400">faltam {formatCurrency(remaining)}</span>
                  </div>
                </div>

                {/* Deadline */}
                {goal.deadline && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                    <Clock className="w-3.5 h-3.5" />
                    Prazo: {formatDate(goal.deadline)}
                  </div>
                )}

                {/* Add contribution button */}
                {goal.status === 'active' && (
                  <button
                    onClick={() => setContributionGoal(goal)}
                    className="w-full py-2 rounded-xl text-sm font-medium border-2 border-dashed transition-all hover:border-solid"
                    style={{ borderColor: goal.color ?? '#10b981', color: goal.color ?? '#10b981' }}
                  >
                    + Adicionar valor
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <GoalModal open={goalModalOpen} onClose={() => { setGoalModalOpen(false); setEditTarget(null) }} editData={editTarget} />
      <ContributionModal open={!!contributionGoal} onClose={() => setContributionGoal(null)} goal={contributionGoal} />
    </div>
  )
}

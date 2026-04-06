import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Trash2, Edit2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/app/hooks/useTransactions'
import { useCategories } from '@/app/hooks/useCategories'
import { transactionSchema, type TransactionInput } from '@/app/validators/transaction.schema'
import { formatCurrency, formatDate } from '@/app/utils/formatters'
import type { TransactionWithCategory, TransactionFilters } from '@/app/types'

const today = format(new Date(), 'yyyy-MM-dd')

function TransactionModal({
  open,
  onClose,
  editData,
}: {
  open: boolean
  onClose: () => void
  editData?: TransactionWithCategory | null
}) {
  const { data: allCategories } = useCategories()
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()

  const isEdit = !!editData

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: editData
      ? {
          description: editData.description,
          amount: editData.amount,
          type: editData.type as 'income' | 'expense',
          category_id: editData.category_id,
          date: editData.date,
          notes: editData.notes ?? '',
          is_recurring: editData.is_recurring ?? false,
          recurring_interval: (editData.recurring_interval as 'weekly' | 'monthly' | 'yearly') ?? undefined,
        }
      : { type: 'expense', date: today, is_recurring: false },
  })

  // Reseta o form quando o alvo de edição muda
  useEffect(() => {
    if (open) {
      reset(editData
        ? {
            description: editData.description,
            amount: editData.amount,
            type: editData.type as 'income' | 'expense',
            category_id: editData.category_id,
            date: editData.date,
            notes: editData.notes ?? '',
            is_recurring: editData.is_recurring ?? false,
            recurring_interval: (editData.recurring_interval as 'weekly' | 'monthly' | 'yearly') ?? undefined,
          }
        : { type: 'expense', date: today, is_recurring: false }
      )
    }
  }, [open, editData, reset])

  const type = watch('type')
  const isRecurring = watch('is_recurring')

  const filteredCategories = (allCategories ?? []).filter(
    (c) => c.type === type || c.type === 'both'
  )

  async function onSubmit(data: TransactionInput) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: editData!.id, input: data })
      } else {
        await createMutation.mutateAsync(data)
      }
      reset()
      onClose()
    } catch {
      // erro tratado pelo MutationCache global (toast + log)
    }
  }

  function onInvalid(errs: object) {
    console.error('[TransactionModal] validação falhou:', errs)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            <label className={`flex items-center justify-center gap-2 py-2 rounded-lg cursor-pointer font-medium text-sm transition-all ${type === 'expense' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}>
              <input type="radio" value="expense" className="hidden" {...register('type')} />
              <ArrowDownRight className="w-4 h-4" />
              Despesa
            </label>
            <label className={`flex items-center justify-center gap-2 py-2 rounded-lg cursor-pointer font-medium text-sm transition-all ${type === 'income' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>
              <input type="radio" value="income" className="hidden" {...register('type')} />
              <ArrowUpRight className="w-4 h-4" />
              Receita
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              {...register('description')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Almoço restaurante"
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                {...register('category_id')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Selecionar...</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                {...register('date')}
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Observações..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('is_recurring')} className="w-4 h-4 rounded accent-emerald-500" />
            <span className="text-sm text-gray-700">Transação recorrente</span>
          </label>

          {isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo</label>
              <select
                {...register('recurring_interval')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Selecionar...</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
              {errors.recurring_interval && <p className="text-xs text-red-500 mt-1">{errors.recurring_interval.message}</p>}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 text-sm"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Transactions() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TransactionWithCategory | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const filters: TransactionFilters = {
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isLoading } = useTransactions(filters)
  const deleteMutation = useDeleteTransaction()

  const transactions = data?.data ?? []
  const totalCount = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  function openEdit(t: TransactionWithCategory) {
    setEditTarget(t)
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
    if (confirm('Remover esta transação?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar transações..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['all', 'income', 'expense'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                typeFilter === t
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'all' ? 'Todos' : t === 'income' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>

        <button
          onClick={openNew}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nova Transação
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            <p>Nenhuma transação encontrada.</p>
            <button onClick={openNew} className="mt-3 text-emerald-600 font-medium hover:underline">
              Adicionar primeira transação
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Descrição</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Categoria</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Data</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Valor</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((t: TransactionWithCategory) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            {t.type === 'income'
                              ? <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                              : <ArrowDownRight className="w-4 h-4 text-red-600" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{t.description}</p>
                            {t.notes && <p className="text-xs text-gray-400 truncate max-w-[200px]">{t.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {t.categories ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.categories.color ?? '#6b7280' }} />
                            {t.categories.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(t.date)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(t)}
                            className="p-2 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deleteMutation.isPending}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {totalCount} {totalCount === 1 ? 'transação' : 'transações'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <TransactionModal open={modalOpen} onClose={handleClose} editData={editTarget} />
    </div>
  )
}

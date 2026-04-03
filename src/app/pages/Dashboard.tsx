import { useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { subMonths } from 'date-fns'
import { useQueries } from '@tanstack/react-query'
import { useMonthlySummary, useTransactions } from '@/app/hooks/useTransactions'
import { useGoals } from '@/app/hooks/useGoals'
import { useCategories } from '@/app/hooks/useCategories'
import { formatCurrency, formatDate, toFirstDayOfMonth } from '@/app/utils/formatters'
import { calculatePercentageChange } from '@/app/utils/calculations'
import { transactionsService } from '@/app/services/transactions.service'
import { QUERY_KEYS } from '@/app/config/queryKeys'
import RevenueExpenseChart from '@/app/components/charts/RevenueExpenseChart'
import CategoryPieChart from '@/app/components/charts/CategoryPieChart'
import type { TransactionWithCategory } from '@/app/types'

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Gera os últimos 6 meses como strings 'yyyy-MM-dd'
const last6Months = Array.from({ length: 6 }, (_, i) =>
  toFirstDayOfMonth(subMonths(new Date(), 5 - i))
)

export default function Dashboard() {
  const [_modal, setModal] = useState(false)

  const thisMonth = toFirstDayOfMonth()
  const lastMonth = toFirstDayOfMonth(subMonths(new Date(), 1))

  const { data: current }          = useMonthlySummary(thisMonth)
  const { data: previous }         = useMonthlySummary(lastMonth)
  const { data: transactionsData } = useTransactions({ pageSize: 5 })
  const { data: goals }            = useGoals()
  const { data: categories }       = useCategories('expense')

  // Busca os 6 meses em paralelo para o gráfico
  const monthlyQueries = useQueries({
    queries: last6Months.map((month) => ({
      queryKey: QUERY_KEYS.transactionsSummary(month),
      queryFn: () => transactionsService.getMonthlySummary(month),
    })),
  })

  // Busca todas as despesas do mês atual para o gráfico de categorias
  const { data: allCurrentMonthExpenses } = useTransactions({
    type: 'expense',
    dateFrom: thisMonth,
    dateTo: toFirstDayOfMonth(subMonths(new Date(), -1)).replace(/-\d{2}$/, '') + '-' +
      String(new Date(new Date(thisMonth).getFullYear(), new Date(thisMonth).getMonth() + 1, 0).getDate()).padStart(2, '0'),
    pageSize: 500,
  })

  const income   = current?.income   ?? 0
  const expenses = current?.expenses ?? 0
  const balance  = income - expenses
  const prevIncome   = previous?.income   ?? 0
  const prevExpenses = previous?.expenses ?? 0

  // Gráfico de linha: dados reais dos últimos 6 meses
  const chartData = last6Months.map((_month, i) => {
    const summary = monthlyQueries[i]?.data
    const d = subMonths(new Date(), 5 - i)
    return {
      month: MONTHS_SHORT[d.getMonth()],
      receitas: summary?.income   ?? 0,
      despesas: summary?.expenses ?? 0,
    }
  })

  // Gráfico de pizza: gastos reais por categoria no mês atual
  const categoryMap = new Map<string, { name: string; value: number; color: string }>()
  for (const t of (allCurrentMonthExpenses?.data ?? []) as TransactionWithCategory[]) {
    if (!t.categories) continue
    const existing = categoryMap.get(t.category_id)
    if (existing) {
      existing.value += t.amount
    } else {
      categoryMap.set(t.category_id, {
        name: t.categories.name,
        value: t.amount,
        color: t.categories.color ?? '#6b7280',
      })
    }
  }
  const categoryChartData = Array.from(categoryMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Fallback: se não há despesas ainda, mostra categorias padrão com 0
  const pieData = categoryChartData.length > 0
    ? categoryChartData
    : (categories ?? []).filter(c => c.is_default).slice(0, 6).map(c => ({ name: c.name, value: 0, color: c.color ?? '#6b7280' }))

  const totalGoalsSaved = (goals ?? []).reduce((s, g) => s + g.current_amount, 0)
  const activeGoals     = (goals ?? []).filter(g => g.status === 'active').length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Receitas"
          value={formatCurrency(income)}
          badge={`${calculatePercentageChange(income, prevIncome) >= 0 ? '+' : ''}${calculatePercentageChange(income, prevIncome)}%`}
          bgColor="bg-emerald-100" iconColor="text-emerald-600" badgeClass="bg-emerald-50 text-emerald-600"
          icon={TrendingUp}
        />
        <SummaryCard
          title="Despesas"
          value={formatCurrency(expenses)}
          badge={`${calculatePercentageChange(expenses, prevExpenses) >= 0 ? '+' : ''}${calculatePercentageChange(expenses, prevExpenses)}%`}
          bgColor="bg-red-100" iconColor="text-red-600" badgeClass="bg-red-50 text-red-600"
          icon={TrendingDown}
        />
        <SummaryCard
          title="Saldo Atual"
          value={formatCurrency(balance)}
          badge="Este mês"
          bgColor="bg-blue-100" iconColor="text-blue-600" badgeClass="bg-blue-50 text-blue-600"
          icon={Wallet}
        />
        <SummaryCard
          title="Economias"
          value={formatCurrency(totalGoalsSaved)}
          badge={`${activeGoals} ${activeGoals === 1 ? 'meta' : 'metas'}`}
          bgColor="bg-purple-100" iconColor="text-purple-600" badgeClass="bg-purple-50 text-purple-600"
          icon={PiggyBank}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <RevenueExpenseChart data={chartData} />
        <CategoryPieChart data={pieData} />
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">Transações Recentes</h3>
          <button
            onClick={() => setModal(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Transação
          </button>
        </div>

        <div className="space-y-3">
          {(transactionsData?.data ?? []).length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              Nenhuma transação encontrada. Adicione a primeira!
            </p>
          ) : (
            (transactionsData?.data ?? []).map((t: TransactionWithCategory) => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {t.type === 'income'
                      ? <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                      : <ArrowDownRight className="w-5 h-5 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{t.description}</p>
                    <p className="text-sm text-gray-500">{t.categories?.name ?? '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(t.date)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, badge, bgColor, iconColor, badgeClass, icon: Icon }: {
  title: string; value: string; badge: string
  bgColor: string; iconColor: string; badgeClass: string
  icon: React.ElementType
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`${bgColor} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeClass}`}>{badge}</span>
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

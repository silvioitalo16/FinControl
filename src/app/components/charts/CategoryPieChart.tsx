import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/app/utils/formatters'

interface CategoryPoint {
  name: string
  value: number
  color: string
}

interface Props {
  data: CategoryPoint[]
}

export default function CategoryPieChart({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Despesas por Categoria</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }}
            formatter={(v: number) => [formatCurrency(v), '']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 space-y-2">
        {data.map((cat, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-gray-700 truncate max-w-[130px]">{cat.name}</span>
            </div>
            <span className="font-semibold text-gray-800">{formatCurrency(cat.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

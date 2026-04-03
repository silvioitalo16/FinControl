import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'

interface MonthlyPoint {
  month: string
  receitas: number
  despesas: number
}

interface Props {
  data: MonthlyPoint[]
}

export default function RevenueExpenseChart({ data }: Props) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">Receitas vs Despesas</h3>
        <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" stroke="#9ca3af" fontSize={13} />
          <YAxis stroke="#9ca3af" fontSize={13} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }}
            formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
          />
          <Legend />
          <Line type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} name="Receitas" />
          <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 5 }} name="Despesas" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

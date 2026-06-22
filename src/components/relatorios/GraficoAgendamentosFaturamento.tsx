'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { CalendarDays, TrendingUp, BarChart2, DollarSign } from 'lucide-react'

export type DadosMes = {
  mes: string
  agendamentos: number
  concluidos: number
  outros: number        // cancelados + confirmados + agendados
  faturamento: number
}

interface Props {
  dados: DadosMes[]
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtK = (v: number) =>
  v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const concluidos  = payload.find(p => p.name === 'Concluídos')?.value ?? 0
  const outros      = payload.find(p => p.name === 'Outros')?.value ?? 0
  const faturamento = payload.find(p => p.name === 'Faturamento')?.value ?? 0
  const total = concluidos + outros

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[190px]">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Total agendamentos</span>
          <span className="font-medium">{total}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" />Concluídos</span>
          <span className="font-medium text-green-700">{concluidos}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-gray-300 inline-block" />Outros</span>
          <span className="font-medium text-gray-500">{outros}</span>
        </div>
        <div className="border-t border-gray-100 pt-1 mt-1 flex justify-between gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Faturamento</span>
          <span className="font-semibold text-amber-700">{fmt(faturamento)}</span>
        </div>
      </div>
    </div>
  )
}

export default function GraficoAgendamentosFaturamento({ dados }: Props) {
  if (!dados.length) {
    return <p className="text-center py-12 text-gray-400 text-sm">Nenhum dado disponível.</p>
  }

  // ── Cards de resumo ────────────────────────────────────────────────────
  const melhorAgMes   = dados.reduce((a, b) => b.agendamentos > a.agendamentos ? b : a, dados[0])
  const melhorFatMes  = dados.reduce((a, b) => b.faturamento  > a.faturamento  ? b : a, dados[0])
  const mediaAg       = dados.reduce((s, d) => s + d.agendamentos, 0) / dados.length
  const mediaFat      = dados.reduce((s, d) => s + d.faturamento,  0) / dados.length

  const cards = [
    {
      label: 'Mês com mais agendamentos',
      value: melhorAgMes.mes,
      sub: `${melhorAgMes.agendamentos} agendamentos`,
      icon: CalendarDays,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Mês com maior faturamento',
      value: melhorFatMes.mes,
      sub: fmt(melhorFatMes.faturamento),
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Média de agendamentos/mês',
      value: mediaAg.toFixed(1),
      sub: `em ${dados.length} meses`,
      icon: BarChart2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Média de faturamento/mês',
      value: fmt(mediaFat),
      sub: `em ${dados.length} meses`,
      icon: DollarSign,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 leading-tight">{label}</p>
                  <p className={`text-lg font-bold mt-1 truncate ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
                <span className={`p-2 rounded-lg ${bg} shrink-0`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico */}
      <Card>
        <CardContent className="pt-6 pb-4 px-2 sm:px-6">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={dados} margin={{ top: 8, right: 60, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                interval={dados.length > 14 ? 1 : 0}
                angle={dados.length > 10 ? -35 : 0}
                textAnchor={dados.length > 10 ? 'end' : 'middle'}
                height={dados.length > 10 ? 50 : 24}
              />
              {/* Eixo Y esquerdo — quantidade */}
              <YAxis
                yAxisId="qty"
                orientation="left"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                allowDecimals={false}
                width={32}
              />
              {/* Eixo Y direito — faturamento */}
              <YAxis
                yAxisId="fat"
                orientation="right"
                tick={{ fontSize: 11, fill: '#d97706' }}
                tickFormatter={fmtK}
                width={56}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(v) => v}
              />
              {/* Barras empilhadas */}
              <Bar yAxisId="qty" dataKey="concluidos" name="Concluídos" stackId="ag"
                fill="#22c55e" maxBarSize={40} />
              <Bar yAxisId="qty" dataKey="outros" name="Outros" stackId="ag"
                fill="#d1d5db" maxBarSize={40} radius={[3, 3, 0, 0]} />
              {/* Linha de faturamento */}
              <Line
                yAxisId="fat"
                type="monotone"
                dataKey="faturamento"
                name="Faturamento"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

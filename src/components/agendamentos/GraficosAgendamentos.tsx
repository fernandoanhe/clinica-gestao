'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { CheckCircle2, XCircle, Calendar, TrendingUp } from 'lucide-react'

type DadosMes = {
  mes: string
  concluido: number
  confirmado: number
  cancelado: number
  agendado: number
}

type DadosTendencia = { mes: string; total: number }

type DadosProcedimento = { nome: string; quantidade: number; percentual: number }

type Cards = {
  total: number
  concluidos: number
  cancelados: number
  taxaComparecimento: number
}

interface Props {
  cards: Cards
  dadosMes: DadosMes[]
  dadosTendencia: DadosTendencia[]
  dadosPizza: DadosProcedimento[]
  dadosRanking: DadosProcedimento[]
}

const CORES_STATUS = {
  concluido:  '#22c55e',
  confirmado: '#eab308',
  cancelado:  '#ef4444',
  agendado:   '#3b82f6',
}

const PIE_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b',
]

const LABELS_STATUS: Record<string, string> = {
  concluido:  'Concluído',
  confirmado: 'Confirmado',
  cancelado:  'Cancelado',
  agendado:   'Agendado',
}

export default function GraficosAgendamentos({
  cards,
  dadosMes,
  dadosTendencia,
  dadosPizza,
  dadosRanking,
}: Props) {
  const totalPizza = dadosPizza.reduce((s, d) => s + d.quantidade, 0)

  const cardItems = [
    {
      label: 'Total de agendamentos',
      value: cards.total.toLocaleString('pt-BR'),
      sub: 'histórico completo',
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Concluídos',
      value: cards.concluidos.toLocaleString('pt-BR'),
      sub: `${cards.total > 0 ? ((cards.concluidos / cards.total) * 100).toFixed(1) : 0}% do total`,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Cancelados',
      value: cards.cancelados.toLocaleString('pt-BR'),
      sub: `${cards.total > 0 ? ((cards.cancelados / cards.total) * 100).toFixed(1) : 0}% do total`,
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Taxa de comparecimento',
      value: `${cards.taxaComparecimento.toFixed(1)}%`,
      sub: 'concluídos / (total − agendados)',
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Seção 1: Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cardItems.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 leading-tight">{label}</p>
                  <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </div>
                <span className={`p-2 rounded-lg ${bg} shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Seção 2: Barras empilhadas por mês ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-gray-700">
            Agendamentos por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={dadosMes} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                interval={dadosMes.length > 16 ? 1 : 0}
                angle={dadosMes.length > 12 ? -35 : 0}
                textAnchor={dadosMes.length > 12 ? 'end' : 'middle'}
                height={dadosMes.length > 12 ? 48 : 24}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip
                formatter={(value, name) => [Number(value), LABELS_STATUS[String(name)] ?? String(name)]}
              />
              <Legend formatter={(v) => LABELS_STATUS[v] ?? v} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="concluido"  stackId="a" fill={CORES_STATUS.concluido}  maxBarSize={40} />
              <Bar dataKey="confirmado" stackId="a" fill={CORES_STATUS.confirmado} maxBarSize={40} />
              <Bar dataKey="cancelado"  stackId="a" fill={CORES_STATUS.cancelado}  maxBarSize={40} />
              <Bar dataKey="agendado"   stackId="a" fill={CORES_STATUS.agendado}   maxBarSize={40} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Seção 3: Tendência de concluídos ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-gray-700">
            Tendência de Atendimentos Concluídos por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dadosTendencia} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                interval={dadosTendencia.length > 16 ? 1 : 0}
                angle={dadosTendencia.length > 12 ? -35 : 0}
                textAnchor={dadosTendencia.length > 12 ? 'end' : 'middle'}
                height={dadosTendencia.length > 12 ? 48 : 24}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip formatter={(v) => [Number(v ?? 0), 'Concluídos']} />
              <Line
                type="monotone"
                dataKey="total"
                name="Concluídos"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#22c55e' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Seções 4 e 5: Pizza + Ranking horizontal ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pizza: top 10 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-700">
              Top 10 Procedimentos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPizza.length === 0 ? (
              <p className="text-center py-10 text-gray-400 text-sm">Nenhum dado disponível.</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width={240} height={240}>
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      dataKey="quantidade"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      innerRadius={40}
                    >
                      {dadosPizza.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => {
                        const n = Number(v ?? 0)
                        return [`${n} (${totalPizza > 0 ? ((n / totalPizza) * 100).toFixed(1) : 0}%)`, 'Realizações']
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2 flex-1 min-w-0">
                  {dadosPizza.map((d, idx) => (
                    <div key={d.nome} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-gray-700 truncate flex-1" title={d.nome}>
                        {d.nome}
                      </span>
                      <span className="font-semibold text-gray-800 shrink-0">{d.quantidade}</span>
                      <span className="text-gray-400 shrink-0 w-10 text-right">
                        {d.percentual.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking horizontal: top 15 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-700">
              Ranking de Procedimentos — Top 15
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosRanking.length === 0 ? (
              <p className="text-center py-10 text-gray-400 text-sm">Nenhum dado disponível.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(300, dadosRanking.length * 34)}>
                <BarChart
                  layout="vertical"
                  data={dadosRanking}
                  margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <YAxis
                    dataKey="nome"
                    type="category"
                    width={160}
                    tick={{ fontSize: 10, fill: '#374151' }}
                    tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 21) + '…' : v}
                  />
                  <Tooltip
                    formatter={(v) => [Number(v ?? 0), 'Realizações']}
                    labelFormatter={(label) => String(label)}
                  />
                  <Bar dataKey="quantidade" name="Realizações" fill="#6366f1" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#6b7280' }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Transacao } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b']

const FORMA_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Crédito',
  debito: 'Débito',
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function GraficoPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const inicio = new Date()
    inicio.setDate(1)
    inicio.setMonth(inicio.getMonth() - 5)

    supabase
      .from('transacoes')
      .select('*')
      .gte('data', inicio.toISOString().split('T')[0])
      .order('data', { ascending: true })
      .then(({ data }) => {
        setTransacoes((data ?? []) as Transacao[])
        setLoading(false)
      })
  }, [])

  // Últimos 6 meses
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: MESES_ABREV[d.getMonth()],
    }
  })

  // Dados do gráfico de barras
  const barData = last6.map(m => {
    const prefix = `${m.year}-${m.month.toString().padStart(2, '0')}`
    const receitas = transacoes
      .filter(t => t.tipo === 'receita' && t.data.startsWith(prefix))
      .reduce((s, t) => s + Number(t.valor), 0)
    const despesas = transacoes
      .filter(t => t.tipo === 'despesa' && t.data.startsWith(prefix))
      .reduce((s, t) => s + Number(t.valor), 0)
    return { mes: m.label, Receitas: receitas, Despesas: despesas }
  })

  // Dados do gráfico de pizza (receitas por forma de pagamento)
  const pagMap: Record<string, number> = {}
  transacoes
    .filter(t => t.tipo === 'receita')
    .forEach(t => {
      const key = t.forma_pagamento
        ? (FORMA_LABELS[t.forma_pagamento] ?? t.forma_pagamento)
        : 'Não informado'
      pagMap[key] = (pagMap[key] ?? 0) + Number(t.valor)
    })
  const pieData = Object.entries(pagMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Carregando...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/financeiro"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800">Gráficos Financeiros</h1>
      </div>

      {/* Gráfico de barras — Receitas x Despesas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base font-medium text-gray-700">
            Receitas × Despesas — Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={v => `R$ ${Number(v).toLocaleString('pt-BR')}`}
                width={80}
              />
              <Tooltip
                formatter={(value: number) => [fmt(value), '']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de pizza — Forma de pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-gray-700">
            Receitas por Forma de Pagamento — Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">
              Nenhuma receita registrada no período.
            </p>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ResponsiveContainer width={280} height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={45}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [fmt(value), '']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {pieData.map((item, idx) => {
                  const total = pieData.reduce((s, d) => s + d.value, 0)
                  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-sm text-gray-700 w-28">{item.name}</span>
                      <span className="text-sm font-medium text-gray-900">{fmt(item.value)}</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

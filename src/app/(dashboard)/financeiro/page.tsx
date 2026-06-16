'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Transacao } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, DollarSign, Plus, AreaChart } from 'lucide-react'

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

const FORMA_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Crédito',
  debito: 'Débito',
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function FinanceiroPage() {
  const now = new Date()
  const anoAtual = now.getFullYear()

  const [mes, setMes] = useState(now.getMonth() + 1)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const mesStr = mes.toString().padStart(2, '0')
    const ultimoDia = new Date(anoAtual, mes, 0).getDate()
    const inicio = `${anoAtual}-${mesStr}-01`
    const fim = `${anoAtual}-${mesStr}-${ultimoDia.toString().padStart(2, '0')}`

    setLoading(true)
    supabase
      .from('transacoes')
      .select('*')
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: false })
      .then(({ data }) => {
        setTransacoes((data ?? []) as Transacao[])
        setLoading(false)
      })
  }, [mes, anoAtual])

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0)
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0)
  const lucro = totalReceitas - totalDespesas

  const filtradas = filtroTipo === 'todos'
    ? transacoes
    : transacoes.filter(t => t.tipo === filtroTipo)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Financeiro</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/financeiro/grafico">
              <AreaChart className="h-4 w-4 mr-2" />
              Ver Gráficos
            </Link>
          </Button>
          <Button asChild>
            <Link href="/financeiro/nova-despesa">
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Receitas do Mês</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">{fmt(totalReceitas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Despesas do Mês</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-500">{fmt(totalDespesas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Lucro do Mês</CardTitle>
            <DollarSign className={`h-5 w-5 ${lucro >= 0 ? 'text-green-600' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${lucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {fmt(lucro)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((nome, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {nome} {anoAtual}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {[
          { value: 'todos', label: 'Todos' },
          { value: 'receita', label: 'Receitas' },
          { value: 'despesa', label: 'Despesas' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFiltroTipo(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filtroTipo === value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-400">Carregando...</TableCell>
              </TableRow>
            ) : filtradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-400">Nenhuma transação encontrada.</TableCell>
              </TableRow>
            ) : filtradas.map(t => (
              <TableRow key={t.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>{t.descricao}</TableCell>
                <TableCell>{t.categoria ?? '—'}</TableCell>
                <TableCell>
                  {t.forma_pagamento ? (FORMA_LABELS[t.forma_pagamento] ?? t.forma_pagamento) : '—'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${
                    t.tipo === 'receita'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {t.tipo === 'receita' ? 'Receita' : 'Despesa'}
                  </span>
                </TableCell>
                <TableCell className={`text-right font-medium ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-500'}`}>
                  {t.tipo === 'despesa' && '− '}{fmt(Number(t.valor))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

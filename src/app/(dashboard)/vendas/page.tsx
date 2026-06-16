'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Venda } from '@/types'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, TrendingUp, Clock, ShoppingCart } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  pago: 'bg-green-100 text-green-700 border-green-200',
  parcialmente_pago: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelado: 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  parcialmente_pago: 'Parc. Pago',
  cancelado: 'Cancelado',
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    setLoading(true)
    supabase
      .from('vendas')
      .select('*, cliente:clientes(nome)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setVendas((data ?? []) as Venda[])
        setLoading(false)
      })
  }, [])

  const ativas = vendas.filter(v => v.status !== 'cancelado')
  const totalReceita = ativas.filter(v => v.status === 'pago').reduce((s, v) => s + Number(v.total_final), 0)
  const totalPendente = ativas
    .filter(v => v.status === 'pendente' || v.status === 'parcialmente_pago')
    .reduce((s, v) => s + Number(v.total_final), 0)

  const filtradas = filtroStatus === 'todos'
    ? vendas
    : vendas.filter(v => v.status === filtroStatus)

  const statusFiltros = ['todos', 'pendente', 'parcialmente_pago', 'pago', 'cancelado']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Vendas</h1>
        <Link href="/vendas/nova" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Vendas</CardTitle>
            <ShoppingCart className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-800">{ativas.length}</p>
            <p className="text-xs text-gray-400 mt-1">vendas ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Receita Recebida</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">{fmt(totalReceita)}</p>
            <p className="text-xs text-gray-400 mt-1">vendas pagas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">A Receber</CardTitle>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-yellow-600">{fmt(totalPendente)}</p>
            <p className="text-xs text-gray-400 mt-1">pendente / parcial</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {statusFiltros.map(s => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filtroStatus === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'todos' ? 'Todos' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Total Final</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">Carregando...</TableCell>
              </TableRow>
            ) : filtradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">Nenhuma venda encontrada.</TableCell>
              </TableRow>
            ) : filtradas.map(v => (
              <TableRow key={v.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {new Date(v.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="font-medium">{v.cliente?.nome ?? '—'}</TableCell>
                <TableCell>{fmt(Number(v.total))}</TableCell>
                <TableCell className="text-red-500">
                  {Number(v.desconto) > 0 ? `− ${fmt(Number(v.desconto))}` : '—'}
                </TableCell>
                <TableCell className="font-semibold">{fmt(Number(v.total_final))}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_COLORS[v.status]}`}>
                    {STATUS_LABELS[v.status]}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/vendas/${v.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Ver
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

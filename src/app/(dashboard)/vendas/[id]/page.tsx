'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Venda, VendaItem, VendaPagamento } from '@/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

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

const PAG_STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  pago: 'bg-green-100 text-green-700 border-green-200',
  cancelado: 'bg-red-100 text-red-700 border-red-200',
}

const FORMA_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Crédito',
  debito: 'Débito',
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function VendaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const [venda, setVenda] = useState<Venda | null>(null)
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState(false)

  const loadVenda = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('vendas')
      .select('*, cliente:clientes(nome), venda_itens(*), venda_pagamentos(*)')
      .eq('id', id)
      .single()
    setVenda(data as Venda)
    setLoading(false)
  }, [id])

  useEffect(() => { loadVenda() }, [loadVenda])

  async function marcarPago(pagId: string) {
    setAtualizando(pagId)
    const supabase = createClient()
    await supabase.from('venda_pagamentos').update({ status: 'pago' }).eq('id', pagId)

    // Recalculate venda status
    const pagamentos = (venda!.venda_pagamentos ?? []).map(p =>
      p.id === pagId ? { ...p, status: 'pago' as const } : p
    )
    const active = pagamentos.filter(p => p.status !== 'cancelado')
    const allPaid = active.length > 0 && active.every(p => p.status === 'pago')
    const somePaid = active.some(p => p.status === 'pago')
    const newStatus = allPaid ? 'pago' : somePaid ? 'parcialmente_pago' : 'pendente'

    if (newStatus !== venda!.status) {
      await supabase.from('vendas').update({ status: newStatus }).eq('id', id)
    }

    setAtualizando(null)
    loadVenda()
  }

  async function cancelarVenda() {
    if (!confirm('Cancelar esta venda? Esta ação não pode ser desfeita.')) return
    setCancelando(true)
    const supabase = createClient()
    await supabase.from('vendas').update({ status: 'cancelado' }).eq('id', id)
    setCancelando(false)
    loadVenda()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">Carregando...</div>
    )
  }

  if (!venda) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Venda não encontrada.</p>
        <Link href="/vendas" className={buttonVariants({ variant: 'outline' })}>Voltar</Link>
      </div>
    )
  }

  const itens = (venda.venda_itens ?? []) as VendaItem[]
  const pagamentos = (venda.venda_pagamentos ?? []).sort(
    (a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
  ) as VendaPagamento[]

  const totalPago = pagamentos.filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.valor), 0)
  const totalPendente = pagamentos.filter(p => p.status === 'pendente').reduce((s, p) => s + Number(p.valor), 0)

  const podeCancelar = venda.status !== 'cancelado' && venda.status !== 'pago'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vendas" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-800">Detalhe da Venda</h1>
        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs border font-medium ${STATUS_COLORS[venda.status]}`}>
          {STATUS_LABELS[venda.status]}
        </span>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Cliente</span>
              <span className="font-medium">{venda.cliente?.nome ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Data</span>
              <span>{new Date(venda.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
            {venda.observacoes && (
              <div className="flex justify-between">
                <span className="text-gray-500">Observações</span>
                <span className="text-right max-w-[200px]">{venda.observacoes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{fmt(Number(venda.total))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Desconto</span>
              <span className={Number(venda.desconto) > 0 ? 'text-red-500' : ''}>
                {Number(venda.desconto) > 0 ? `− ${fmt(Number(venda.desconto))}` : '—'}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t border-gray-100 pt-2 mt-1">
              <span>Total Final</span>
              <span className="text-green-600">{fmt(Number(venda.total_final))}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>Pago · Pendente</span>
              <span>{fmt(totalPago)} · {fmt(totalPendente)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itens */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Preço Unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-400">Sem itens.</TableCell>
              </TableRow>
            ) : itens.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.descricao}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${
                    item.tipo === 'servico'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    {item.tipo === 'servico' ? 'Serviço' : 'Produto'}
                  </span>
                </TableCell>
                <TableCell className="text-right">{Number(item.quantidade)}</TableCell>
                <TableCell className="text-right">{fmt(Number(item.preco_unitario))}</TableCell>
                <TableCell className="text-right font-medium">{fmt(Number(item.subtotal))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagamentos */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pagamentos</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimento</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pago em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagamentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-400">Sem pagamentos.</TableCell>
              </TableRow>
            ) : pagamentos.map(pag => {
              const vencido = pag.status === 'pendente' && new Date(pag.data_vencimento + 'T00:00:00') < new Date()
              return (
                <TableRow key={pag.id}>
                  <TableCell className={`text-sm whitespace-nowrap ${vencido ? 'text-red-600 font-medium' : ''}`}>
                    {new Date(pag.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    {vencido && <span className="ml-1 text-xs">(vencido)</span>}
                  </TableCell>
                  <TableCell>{FORMA_LABELS[pag.forma_pagamento] ?? pag.forma_pagamento}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(pag.valor))}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${PAG_STATUS_COLORS[pag.status]}`}>
                      {pag.status === 'pago' ? 'Pago' : pag.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {pag.data_pagamento
                      ? new Date(pag.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')
                      : '—'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {pag.status === 'pendente' && venda.status !== 'cancelado' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 border-green-200 hover:bg-green-50 text-xs h-7 px-2"
                        onClick={() => marcarPago(pag.id)}
                        disabled={atualizando === pag.id}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        {atualizando === pag.id ? '...' : 'Marcar Pago'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Ações da venda */}
      <div className="flex gap-3">
        <Link href="/vendas" className={buttonVariants({ variant: 'outline' })}>
          Voltar
        </Link>
        {podeCancelar && (
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={cancelarVenda}
            disabled={cancelando}
          >
            <XCircle className="h-4 w-4 mr-2" />
            {cancelando ? 'Cancelando...' : 'Cancelar Venda'}
          </Button>
        )}
      </div>
    </div>
  )
}

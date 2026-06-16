'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Agendamento } from '@/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, CalendarDays } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  agendado:  'bg-blue-100 text-blue-700 border-blue-200',
  confirmado:'bg-yellow-100 text-yellow-700 border-yellow-200',
  concluido: 'bg-green-100 text-green-700 border-green-200',
  cancelado: 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const PAGAMENTO_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Crédito',
  debito: 'Débito',
}

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [agendamentoAtivo, setAgendamentoAtivo] = useState<Agendamento | null>(null)
  const [formaPagamento, setFormaPagamento] = useState('')
  const [valorCobrado, setValorCobrado] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function loadAgendamentos() {
    const supabase = createClient()
    setLoading(true)
    const { data } = await supabase
      .from('agendamentos')
      .select('*, cliente:clientes(nome), profissional:profissionais(nome), servico:servicos(nome, preco)')
      .order('data_hora', { ascending: false })
    setAgendamentos((data ?? []) as Agendamento[])
    setLoading(false)
  }

  useEffect(() => { loadAgendamentos() }, [])

  const hoje = new Date().toLocaleDateString('pt-BR')
  const agendamentosHoje = agendamentos.filter(
    a => new Date(a.data_hora).toLocaleDateString('pt-BR') === hoje
  )
  const agendamentosFiltrados = filtroStatus === 'todos'
    ? agendamentos
    : agendamentos.filter(a => a.status === filtroStatus)

  async function confirmar(id: string) {
    const supabase = createClient()
    await supabase.from('agendamentos').update({ status: 'confirmado' }).eq('id', id)
    loadAgendamentos()
  }

  async function cancelar(id: string) {
    const supabase = createClient()
    await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id)
    loadAgendamentos()
  }

  function abrirConcluir(ag: Agendamento) {
    setAgendamentoAtivo(ag)
    setFormaPagamento('')
    setValorCobrado(String(ag.servico?.preco ?? ''))
    setModalOpen(true)
  }

  async function concluir() {
    if (!agendamentoAtivo || !formaPagamento) return
    setSalvando(true)
    const supabase = createClient()
    await supabase.from('agendamentos').update({
      status: 'concluido',
      forma_pagamento: formaPagamento,
      valor_cobrado: Number(valorCobrado),
    }).eq('id', agendamentoAtivo.id)
    setSalvando(false)
    setModalOpen(false)
    setAgendamentoAtivo(null)
    loadAgendamentos()
  }

  const statusFiltros = ['todos', 'agendado', 'confirmado', 'concluido', 'cancelado']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Agendamentos</h1>
        <Link href="/agendamentos/novo" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Link>
      </div>

      {/* Hoje em destaque */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Agendamentos de Hoje ({agendamentosHoje.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agendamentosHoje.length === 0 ? (
            <p className="text-sm text-blue-500">Nenhum agendamento para hoje.</p>
          ) : (
            <div className="space-y-1.5">
              {agendamentosHoje.map(a => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <span className="text-blue-800 font-medium w-14 shrink-0">
                    {new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-blue-900 font-medium">{a.cliente?.nome ?? '—'}</span>
                  <span className="text-blue-600">· {a.servico?.nome ?? '—'}</span>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs border shrink-0 ${STATUS_COLORS[a.status]}`}>
                    {STATUS_LABELS[a.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
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

      {/* Tabela */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-gray-400">Carregando...</TableCell>
              </TableRow>
            ) : agendamentosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-gray-400">Nenhum agendamento encontrado.</TableCell>
              </TableRow>
            ) : agendamentosFiltrados.map(a => (
              <TableRow key={a.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(a.data_hora).toLocaleDateString('pt-BR')}{' '}
                  <span className="text-gray-500">
                    {new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </TableCell>
                <TableCell>{a.cliente?.nome ?? '—'}</TableCell>
                <TableCell>{a.servico?.nome ?? '—'}</TableCell>
                <TableCell>{a.profissional?.nome ?? '—'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_COLORS[a.status]}`}>
                    {STATUS_LABELS[a.status]}
                  </span>
                </TableCell>
                <TableCell>R$ {Number(a.valor_cobrado).toFixed(2)}</TableCell>
                <TableCell>{a.forma_pagamento ? PAGAMENTO_LABELS[a.forma_pagamento] : '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {a.status === 'agendado' && (
                      <Button size="sm" variant="outline" className="text-yellow-700 border-yellow-200 hover:bg-yellow-50 text-xs h-7 px-2"
                        onClick={() => confirmar(a.id)}>
                        Confirmar
                      </Button>
                    )}
                    {(a.status === 'agendado' || a.status === 'confirmado') && (
                      <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50 text-xs h-7 px-2"
                        onClick={() => abrirConcluir(a)}>
                        Concluir
                      </Button>
                    )}
                    {(a.status === 'agendado' || a.status === 'confirmado') && (
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-2"
                        onClick={() => cancelar(a.id)}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Concluir */}
      <Dialog open={modalOpen} onOpenChange={open => { if (!open) { setModalOpen(false); setAgendamentoAtivo(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                  <SelectItem value="debito">Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Cobrado (R$)</Label>
              <Input type="number" step="0.01" min="0" value={valorCobrado} onChange={e => setValorCobrado(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); setAgendamentoAtivo(null) }}>
              Cancelar
            </Button>
            <Button onClick={concluir} disabled={!formaPagamento || salvando}>
              {salvando ? 'Salvando...' : 'Confirmar Conclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Agendamento, Cliente, Produto } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'

// ─── Constants ──────────────────────────────────────────────────────────────

const SLOT_H     = 56           // px per 30-min slot
const START_H    = 8
const END_H      = 20
const SLOTS      = (END_H - START_H) * 2   // 24 slots
const GRID_H     = SLOTS * SLOT_H          // 1344px

const TIME_SLOTS = Array.from({ length: SLOTS }, (_, i) => {
  const h = START_H + Math.floor(i / 2)
  const m = (i % 2) * 30
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const STATUS_BADGE: Record<string, string> = {
  agendado:   'bg-blue-100 border-blue-300 text-blue-700',
  confirmado: 'bg-amber-100 border-amber-300 text-amber-700',
  concluido:  'bg-green-100 border-green-300 text-green-700',
  cancelado:  'bg-gray-100 border-gray-300 text-gray-500',
}
const STATUS_CARD: Record<string, string> = {
  agendado:   'bg-blue-50/80 border-l-[3px] border-l-blue-400 border border-blue-200',
  confirmado: 'bg-amber-50/80 border-l-[3px] border-l-amber-400 border border-amber-200',
  concluido:  'bg-green-50/80 border-l-[3px] border-l-green-400 border border-green-200',
  cancelado:  'bg-gray-50 border-l-[3px] border-l-gray-300 border border-gray-200 opacity-50',
}
const STATUS_LABEL: Record<string, string> = {
  agendado: 'Agendado', confirmado: 'Confirmado',
  concluido: 'Concluído', cancelado: 'Cancelado',
}
const PAG_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'PIX', credito: 'Crédito', debito: 'Débito',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function isToday(d: Date) {
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}
function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}
// Extract BRT date + time using 'sv' locale trick (gives "YYYY-MM-DD HH:MM:SS")
function brt(dataHora: string): { date: string; hour: number; minute: number } {
  const s = new Date(dataHora).toLocaleString('sv', { timeZone: 'America/Sao_Paulo' })
  const [date, time] = s.split(' ')
  const [h, m] = time.split(':').map(Number)
  return { date, hour: h, minute: m }
}
function fmtTime(dataHora: string) {
  const { hour, minute } = brt(dataHora)
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
function cardTop(dataHora: string) {
  const { hour, minute } = brt(dataHora)
  return ((Math.max(START_H, hour) - START_H) * 60 + minute) / 30 * SLOT_H
}

type ProdutoUsado = { uid: string; produto_id: string; quantidade: string }
let _uid = 0
const uid = () => String(++_uid)

// ─── Component ──────────────────────────────────────────────────────────────

export default function AgendaCalendario() {
  const [view, setView]               = useState<'semana' | 'dia'>('semana')
  const [current, setCurrent]         = useState(() => new Date())
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [clientes, setClientes]       = useState<Cliente[]>([])
  const [produtos, setProdutos]       = useState<Produto[]>([])
  const [loading, setLoading]         = useState(true)

  // ── Detail dialog ─────────────────────────────────────────────────────────
  const [sel, setSel]         = useState<Agendamento | null>(null)
  const [detOpen, setDetOpen] = useState(false)

  // ── Conclude dialog ───────────────────────────────────────────────────────
  const [conOpen, setConOpen]     = useState(false)
  const [svRealizado, setSvReal]  = useState('')
  const [prods, setProds]         = useState<ProdutoUsado[]>([])
  const [valor, setValor]         = useState('0')
  const [pagto, setPagto]         = useState('')
  const [saving, setSaving]       = useState(false)

  // ── New appointment dialog ─────────────────────────────────────────────────
  const [newOpen, setNewOpen]   = useState(false)
  const [nData, setNData]       = useState('')
  const [nHora, setNHora]       = useState('')
  const [nCliId, setNCliId]     = useState('')
  const [nCliQ, setNCliQ]       = useState('')
  const [nCliOpen, setNCliOpen] = useState(false)
  const [nSvc, setNSvc]         = useState('')
  const [nObs, setNObs]         = useState('')
  const [nSaving, setNSaving]   = useState(false)

  // ── Computed ──────────────────────────────────────────────────────────────

  const days = useMemo(() => {
    if (view === 'dia') return [new Date(current)]
    const sun = new Date(current)
    sun.setDate(current.getDate() - current.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sun); d.setDate(sun.getDate() + i); return d
    })
  }, [view, current])

  const label = useMemo(() => {
    if (view === 'dia') return current.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const a = days[0], b = days[6]
    if (a.getMonth() === b.getMonth())
      return `${a.getDate()} – ${b.getDate()} ${b.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
    return `${a.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }, [view, current, days])

  // ── Data ──────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)
    const { data } = await supabase
      .from('agendamentos')
      .select('*, cliente:clientes(nome, telefone)')
      .gte('data_hora', `${toDateStr(days[0])}T00:00:00-03:00`)
      .lte('data_hora', `${toDateStr(days[days.length - 1])}T23:59:59-03:00`)
      .order('data_hora')
    setAgendamentos((data ?? []) as Agendamento[])
    setLoading(false)
  }, [days])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('clientes').select('id, nome, telefone').eq('ativo', true).order('nome')
      .then(({ data }) => setClientes((data ?? []) as Cliente[]))
    supabase.from('produtos').select('*').eq('ativo', true).order('nome')
      .then(({ data }) => setProdutos((data ?? []) as Produto[]))
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const navigate = (dir: -1 | 1) => {
    const d = new Date(current)
    d.setDate(d.getDate() + dir * (view === 'semana' ? 7 : 1))
    setCurrent(d)
  }

  const forDay = (day: Date) =>
    agendamentos.filter(a => brt(a.data_hora).date === toDateStr(day))

  const openDetail = (ag: Agendamento) => { setSel(ag); setDetOpen(true) }

  const openConclude = (ag: Agendamento) => {
    setDetOpen(false)
    setSel(ag)
    setSvReal(ag.servico_realizado ?? '')
    setProds([])
    setValor(String(ag.valor_cobrado ?? 0))
    setPagto('')
    setConOpen(true)
  }

  const updateStatus = async (id: string, status: string) => {
    await createClient().from('agendamentos').update({ status }).eq('id', id)
    setDetOpen(false); loadData()
  }

  const concluir = async () => {
    if (!sel || !pagto) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('agendamentos').update({
      status: 'concluido', servico_realizado: svRealizado || null,
      forma_pagamento: pagto, valor_cobrado: Number(valor),
    }).eq('id', sel.id)
    for (const p of prods) {
      if (!p.produto_id || !(Number(p.quantidade) > 0)) continue
      const qty = Number(p.quantidade)
      await supabase.from('movimentacoes_estoque').insert({
        produto_id: p.produto_id, tipo: 'saida', quantidade: qty,
        motivo: 'Atendimento concluído', agendamento_id: sel.id,
      })
      const { data: pr } = await supabase.from('produtos').select('quantidade_atual').eq('id', p.produto_id).single()
      if (pr) await supabase.from('produtos').update({ quantidade_atual: Math.max(0, pr.quantidade_atual - qty) }).eq('id', p.produto_id)
    }
    setSaving(false); setConOpen(false); loadData()
  }

  const openNewSlot = (day: Date, si: number) => {
    const h = START_H + Math.floor(si / 2), m = (si % 2) * 30
    setNData(toDateStr(day)); setNHora(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    setNCliId(''); setNCliQ(''); setNSvc(''); setNObs(''); setNewOpen(true)
  }
  const openNew = () => {
    setNData(toDateStr(current)); setNHora('09:00')
    setNCliId(''); setNCliQ(''); setNSvc(''); setNObs(''); setNewOpen(true)
  }
  const saveNew = async () => {
    if (!nCliId || !nData || !nHora) return
    setNSaving(true)
    await createClient().from('agendamentos').insert({
      cliente_id: nCliId, servico_realizado: nSvc || null,
      data_hora: `${nData}T${nHora}:00`, status: 'agendado', valor_cobrado: 0, observacoes: nObs || null,
    })
    setNSaving(false); setNewOpen(false); loadData()
  }

  const addProd = () => setProds(p => [...p, { uid: uid(), produto_id: '', quantidade: '1' }])
  const rmProd  = (id: string) => setProds(p => p.filter(x => x.uid !== id))
  const upProd  = (id: string, f: 'produto_id' | 'quantidade', v: string) =>
    setProds(p => p.map(x => x.uid === id ? { ...x, [f]: v } : x))

  const nCliSel     = clientes.find(c => c.id === nCliId)
  const nCliFilt    = clientes.filter(c => c.nome.toLowerCase().includes(nCliQ.toLowerCase()))

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['semana', 'dia'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 font-medium transition-colors capitalize border-r last:border-r-0 border-gray-200 ${
                  view === v ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}>{v}</button>
            ))}
          </div>
          {/* Nav */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setCurrent(new Date())} className="px-3 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600">Hoje</button>
            <button onClick={() => navigate(1)}  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <span className="text-sm font-medium text-gray-700 capitalize">{label}</span>
          {loading && <span className="text-xs text-gray-400 animate-pulse">carregando…</span>}
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" />Novo
        </Button>
      </div>

      {/* ── Calendar ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 border border-gray-200 rounded-xl bg-white flex flex-col overflow-hidden">

        {/* Day headers — sticky */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 shrink-0 z-10">
          <div className="w-14 shrink-0 border-r border-gray-200" />
          {days.map((day, i) => (
            <div key={i}
              onClick={() => { setCurrent(new Date(day)); setView('dia') }}
              className={`flex-1 flex flex-col items-center py-2 border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-100/80 transition-colors ${
                view === 'dia' && isSameDay(day, current) ? 'bg-blue-50/40' : ''
              }`}
            >
              <span className="text-[11px] text-gray-400 uppercase tracking-widest">{DIAS[day.getDay()]}</span>
              <span className={`mt-0.5 text-base font-semibold w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                isToday(day) ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'
              }`}>{day.getDate()}</span>
            </div>
          ))}
        </div>

        {/* Scrollable grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex" style={{ height: GRID_H }}>

            {/* Time column */}
            <div className="w-14 shrink-0 border-r border-gray-200 relative" style={{ height: GRID_H }}>
              {TIME_SLOTS.map((slot, i) => (
                <div key={slot} style={{ position: 'absolute', top: i * SLOT_H, height: SLOT_H, width: '100%' }}
                  className="border-b border-gray-100 flex items-start justify-end pr-2 pt-1">
                  {i % 2 === 0 && <span className="text-[10px] text-gray-400 leading-none">{slot}</span>}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, di) => (
              <div key={di} className="flex-1 border-r border-gray-200 last:border-r-0 relative" style={{ height: GRID_H }}>

                {/* Slot backgrounds */}
                {TIME_SLOTS.map((_, si) => (
                  <div key={si}
                    style={{ position: 'absolute', top: si * SLOT_H, height: SLOT_H, left: 0, right: 0 }}
                    className={`border-b cursor-pointer transition-colors hover:bg-blue-50/40 ${
                      si % 2 === 0 ? 'border-gray-200' : 'border-gray-100'
                    }`}
                    onClick={() => openNewSlot(day, si)}
                  />
                ))}

                {/* Cards */}
                {forDay(day).map(ag => {
                  const top = cardTop(ag.data_hora)
                  if (top > GRID_H) return null
                  const height = Math.min(SLOT_H * 2, GRID_H - top)
                  return (
                    <div key={ag.id}
                      style={{ position: 'absolute', top, height, left: 3, right: 3, zIndex: 10 }}
                      onClick={e => { e.stopPropagation(); openDetail(ag) }}
                      className={`rounded-md px-1.5 py-1 overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01] transition-all ${STATUS_CARD[ag.status]}`}
                    >
                      <p className="text-[11px] font-bold leading-tight text-gray-700">{fmtTime(ag.data_hora)}</p>
                      <p className="text-[11px] font-semibold leading-tight truncate">{ag.cliente?.nome ?? '—'}</p>
                      {height >= SLOT_H * 1.5 && (
                        <p className="text-[10px] text-gray-500 leading-tight truncate">{ag.servico_realizado ?? ''}</p>
                      )}
                      {height >= SLOT_H * 2 && Number(ag.valor_cobrado) > 0 && (
                        <p className="text-[10px] text-gray-500">R$ {Number(ag.valor_cobrado).toFixed(2)}</p>
                      )}
                      <span className={`inline-block text-[9px] font-semibold px-1.5 rounded-full border leading-4 mt-0.5 ${STATUS_BADGE[ag.status]}`}>
                        {STATUS_LABEL[ag.status]}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Dialog: Detalhes ──────────────────────────────────────────────── */}
      <Dialog open={detOpen} onOpenChange={o => { if (!o) { setDetOpen(false); setSel(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{sel?.cliente?.nome ?? '—'}</DialogTitle>
          </DialogHeader>
          {sel && (
            <div className="space-y-3 py-1 text-sm">
              <div className="flex flex-wrap gap-6">
                <div><p className="text-xs text-gray-400 mb-0.5">Horário</p>
                  <p className="font-semibold">{fmtTime(sel.data_hora)}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Status</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[sel.status]}`}>
                    {STATUS_LABEL[sel.status]}</span></div>
                {Number(sel.valor_cobrado) > 0 && (
                  <div><p className="text-xs text-gray-400 mb-0.5">Valor</p>
                    <p className="font-semibold">R$ {Number(sel.valor_cobrado).toFixed(2)}</p></div>
                )}
                {sel.forma_pagamento && (
                  <div><p className="text-xs text-gray-400 mb-0.5">Pagamento</p>
                    <p>{PAG_LABEL[sel.forma_pagamento] ?? sel.forma_pagamento}</p></div>
                )}
              </div>
              {sel.servico_realizado && (
                <div><p className="text-xs text-gray-400 mb-0.5">Serviço</p>
                  <p className="text-gray-800">{sel.servico_realizado}</p></div>
              )}
              {sel.observacoes && (
                <div><p className="text-xs text-gray-400 mb-0.5">Observações</p>
                  <p className="text-gray-600">{sel.observacoes}</p></div>
              )}
              {sel.cliente?.telefone && (
                <div><p className="text-xs text-gray-400 mb-0.5">Telefone</p>
                  <p className="text-gray-700">{sel.cliente.telefone}</p></div>
              )}

              <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
                {sel.status === 'agendado' && (
                  <Button size="sm" variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-50"
                    onClick={() => updateStatus(sel.id, 'confirmado')}>Confirmar</Button>
                )}
                {(sel.status === 'agendado' || sel.status === 'confirmado') && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700"
                    onClick={() => openConclude(sel)}>Concluir atendimento</Button>
                )}
                {(sel.status === 'agendado' || sel.status === 'confirmado') && (
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => updateStatus(sel.id, 'cancelado')}>Cancelar</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Concluir ──────────────────────────────────────────────── */}
      <Dialog open={conOpen} onOpenChange={o => { if (!o) setConOpen(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Concluir Atendimento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Serviço realizado</Label>
              <Input placeholder="Ex: Harmonização facial..." value={svRealizado} onChange={e => setSvReal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Produtos utilizados</Label>
              <div className="space-y-2">
                {prods.map(p => (
                  <div key={p.uid} className="grid grid-cols-[1fr_80px_28px] gap-2 items-center">
                    <Select value={p.produto_id} onValueChange={v => upProd(p.uid, 'produto_id', v ?? '')}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Produto..." /></SelectTrigger>
                      <SelectContent>
                        {produtos.map(pr => (
                          <SelectItem key={pr.id} value={pr.id}>
                            {pr.nome} ({pr.quantidade_atual} {pr.unidade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" min="0.01" step="0.01" className="h-8 text-sm"
                      value={p.quantidade} onChange={e => upProd(p.uid, 'quantidade', e.target.value)} />
                    <button onClick={() => rmProd(p.uid)} className="text-gray-300 hover:text-red-500 flex items-center justify-center">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addProd}>
                <Plus className="h-3.5 w-3.5 mr-1" />Adicionar produto
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pagamento <span className="text-red-500">*</span></Label>
                <Select value={pagto} onValueChange={v => setPagto(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor cobrado (R$)</Label>
                <Input type="number" step="0.01" min="0" value={valor} onChange={e => setValor(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConOpen(false)}>Cancelar</Button>
            <Button onClick={concluir} disabled={!pagto || saving}>
              {saving ? 'Salvando…' : 'Confirmar Conclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Novo Agendamento ──────────────────────────────────────── */}
      <Dialog open={newOpen} onOpenChange={o => { if (!o) setNewOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cliente <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  placeholder="Buscar cliente..."
                  value={nCliSel ? nCliSel.nome : nCliQ}
                  onChange={e => { setNCliQ(e.target.value); setNCliId(''); setNCliOpen(true) }}
                  onFocus={() => setNCliOpen(true)}
                  onBlur={() => setTimeout(() => setNCliOpen(false), 150)}
                  autoComplete="off"
                />
                {nCliOpen && nCliFilt.length > 0 && (
                  <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-auto">
                    {nCliFilt.map(c => (
                      <li key={c.id}
                        onMouseDown={() => { setNCliId(c.id); setNCliQ(''); setNCliOpen(false) }}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                        <span>{c.nome}</span>
                        {c.telefone && <span className="text-gray-400 text-xs">· {c.telefone}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data <span className="text-red-500">*</span></Label>
                <Input type="date" value={nData} onChange={e => setNData(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hora <span className="text-red-500">*</span></Label>
                <Input type="time" value={nHora} onChange={e => setNHora(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Serviço</Label>
              <Input placeholder="Ex: Harmonização facial, botox..." value={nSvc} onChange={e => setNSvc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <textarea value={nObs} onChange={e => setNObs(e.target.value)} rows={2}
                placeholder="Observações opcionais..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={saveNew} disabled={!nCliId || !nData || !nHora || nSaving}>
              {nSaving ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Cliente, Produto } from '@/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

type ItemRow = {
  id: string
  tipo: 'produto' | 'servico'
  entityId: string   // produto_id quando tipo=produto, vazio para servico
  descricao: string
  quantidade: string
  preco_unitario: string
}

type PagRow = {
  id: string
  forma_pagamento: string
  valor: string
  data_vencimento: string
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function uid() { return String(Date.now() + Math.random()) }

export default function NovaVendaPage() {
  const router = useRouter()
  const hoje = new Date().toISOString().split('T')[0]

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])

  const [clienteId, setClienteId] = useState('')
  const [clienteQuery, setClienteQuery] = useState('')
  const [clienteOpen, setClienteOpen] = useState(false)
  const [observacoes, setObservacoes] = useState('')

  const [items, setItems] = useState<ItemRow[]>([
    { id: uid(), tipo: 'servico', entityId: '', descricao: '', quantidade: '1', preco_unitario: '' },
  ])
  const [desconto, setDesconto] = useState('0')

  const [pagamentos, setPagamentos] = useState<PagRow[]>([])
  const [nParcelas, setNParcelas] = useState('1')
  const [formaParcela, setFormaParcela] = useState('pix')
  const [dataInicio, setDataInicio] = useState(hoje)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('clientes').select('*').eq('ativo', true).order('nome'),
      supabase.from('produtos').select('*').eq('ativo', true).order('nome'),
    ]).then(([{ data: c }, { data: p }]) => {
      setClientes((c ?? []) as Cliente[])
      setProdutos((p ?? []) as Produto[])
    })
  }, [])

  const clienteSelecionado = clientes.find(c => c.id === clienteId)
  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(clienteQuery.toLowerCase())
  )

  const total = items.reduce((s, i) => s + (Number(i.quantidade) || 0) * (Number(i.preco_unitario) || 0), 0)
  const totalFinal = Math.max(0, total - (Number(desconto) || 0))
  const totalPago = pagamentos.reduce((s, p) => s + (Number(p.valor) || 0), 0)
  const diferenca = totalPago - totalFinal

  function updateItem(rowId: string, field: string, value: string) {
    setItems(prev => prev.map(item => {
      if (item.id !== rowId) return item
      if (field === 'tipo') {
        return { ...item, tipo: value as 'produto' | 'servico', entityId: '', descricao: '', preco_unitario: '' }
      }
      if (field === 'entityId' && item.tipo === 'produto') {
        const p = produtos.find(p => p.id === value)
        return { ...item, entityId: value, descricao: p?.nome ?? '', preco_unitario: p ? String(p.custo_unitario) : '' }
      }
      return { ...item, [field]: value }
    }))
  }

  function addItem() {
    setItems(prev => [...prev, { id: uid(), tipo: 'servico', entityId: '', descricao: '', quantidade: '1', preco_unitario: '' }])
  }

  function removeItem(rowId: string) {
    setItems(prev => prev.filter(i => i.id !== rowId))
  }

  function updatePag(rowId: string, field: string, value: string) {
    setPagamentos(prev => prev.map(p => p.id === rowId ? { ...p, [field]: value } : p))
  }

  function addPag() {
    setPagamentos(prev => [...prev, { id: uid(), forma_pagamento: 'pix', valor: '', data_vencimento: hoje }])
  }

  function removePag(rowId: string) {
    setPagamentos(prev => prev.filter(p => p.id !== rowId))
  }

  function gerarParcelamento() {
    const n = Math.max(1, Math.min(12, Number(nParcelas) || 1))
    const valorParcela = totalFinal > 0 ? totalFinal / n : 0
    const novas: PagRow[] = []
    for (let i = 0; i < n; i++) {
      const d = new Date(dataInicio + 'T00:00:00')
      d.setMonth(d.getMonth() + i)
      novas.push({
        id: uid(),
        forma_pagamento: formaParcela,
        valor: valorParcela.toFixed(2),
        data_vencimento: d.toISOString().split('T')[0],
      })
    }
    setPagamentos(novas)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!clienteId) { setError('Selecione um cliente.'); return }
    if (items.length === 0) { setError('Adicione pelo menos um item.'); return }
    for (const item of items) {
      if (item.tipo === 'produto' && !item.entityId) {
        setError('Selecione o produto em todos os itens do tipo produto.'); return
      }
      if (!item.descricao.trim()) { setError('Informe a descrição em todos os itens.'); return }
      if ((Number(item.quantidade) || 0) <= 0) { setError('Quantidade deve ser maior que zero.'); return }
      if ((Number(item.preco_unitario) || 0) <= 0) { setError('Preço deve ser maior que zero.'); return }
    }
    if (pagamentos.length === 0) { setError('Adicione pelo menos uma forma de pagamento.'); return }
    for (const pag of pagamentos) {
      if (!pag.forma_pagamento) { setError('Selecione a forma de pagamento em todos os pagamentos.'); return }
      if ((Number(pag.valor) || 0) <= 0) { setError('Valor de pagamento deve ser maior que zero.'); return }
      if (!pag.data_vencimento) { setError('Informe a data de vencimento.'); return }
    }

    setLoading(true)
    const supabase = createClient()

    const { data: venda, error: err1 } = await supabase
      .from('vendas')
      .insert({
        cliente_id: clienteId,
        status: 'pendente',
        total,
        desconto: Number(desconto) || 0,
        total_final: totalFinal,
        observacoes: observacoes || null,
      })
      .select()
      .single()

    if (err1 || !venda) {
      setError(err1?.message ?? 'Erro ao criar venda.')
      setLoading(false)
      return
    }

    const { error: err2 } = await supabase.from('venda_itens').insert(
      items.map(i => ({
        venda_id: venda.id,
        tipo: i.tipo,
        produto_id: i.tipo === 'produto' ? i.entityId : null,
        servico_id: null,
        descricao: i.descricao,
        quantidade: Number(i.quantidade),
        preco_unitario: Number(i.preco_unitario),
        subtotal: Number(i.quantidade) * Number(i.preco_unitario),
      }))
    )

    if (err2) { setError(err2.message); setLoading(false); return }

    const { error: err3 } = await supabase.from('venda_pagamentos').insert(
      pagamentos.map(p => ({
        venda_id: venda.id,
        forma_pagamento: p.forma_pagamento,
        valor: Number(p.valor),
        data_vencimento: p.data_vencimento,
        status: 'pendente',
      }))
    )

    if (err3) { setError(err3.message); setLoading(false); return }

    router.push('/vendas')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vendas" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-800">Nova Venda</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">

        {/* Cliente */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-2">
              <Label>Cliente <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  placeholder="Buscar cliente pelo nome..."
                  value={clienteSelecionado ? clienteSelecionado.nome : clienteQuery}
                  onChange={e => { setClienteQuery(e.target.value); setClienteId(''); setClienteOpen(true) }}
                  onFocus={() => setClienteOpen(true)}
                  onBlur={() => setTimeout(() => setClienteOpen(false), 150)}
                  autoComplete="off"
                />
                {clienteOpen && clientesFiltrados.length > 0 && (
                  <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                    {clientesFiltrados.map(c => (
                      <li
                        key={c.id}
                        onMouseDown={() => { setClienteId(c.id); setClienteQuery(''); setClienteOpen(false) }}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                      >
                        {c.nome}
                        {c.telefone && <span className="text-gray-400 ml-2">· {c.telefone}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={2}
                placeholder="Observações opcionais..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Itens */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Itens da Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="hidden md:grid md:grid-cols-[110px_1fr_80px_110px_90px_32px] gap-2 px-0.5">
              {['Tipo', 'Produto / Descrição', 'Qtd', 'Preço Unit.', 'Subtotal', ''].map(h => (
                <span key={h} className="text-xs text-gray-400 font-medium">{h}</span>
              ))}
            </div>

            {items.map(item => {
              const subtotal = (Number(item.quantidade) || 0) * (Number(item.preco_unitario) || 0)
              return (
                <div key={item.id} className="grid grid-cols-[110px_1fr_80px_110px_90px_32px] gap-2 items-center">
                  <Select
                    key={`tipo-${item.id}`}
                    value={item.tipo}
                    onValueChange={v => updateItem(item.id, 'tipo', v ?? 'servico')}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="servico">Serviço</SelectItem>
                      <SelectItem value="produto">Produto</SelectItem>
                    </SelectContent>
                  </Select>

                  {item.tipo === 'produto' ? (
                    <Select
                      key={`entity-${item.id}`}
                      value={item.entityId}
                      onValueChange={v => { if (v) updateItem(item.id, 'entityId', v) }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Selecione o produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      key={`desc-${item.id}`}
                      className="h-9 text-sm"
                      placeholder="Descrição do serviço..."
                      value={item.descricao}
                      onChange={e => updateItem(item.id, 'descricao', e.target.value)}
                    />
                  )}

                  <Input
                    type="number" min="0.01" step="0.01"
                    className="h-9 text-sm"
                    value={item.quantidade}
                    onChange={e => updateItem(item.id, 'quantidade', e.target.value)}
                  />

                  <Input
                    type="number" min="0.01" step="0.01"
                    className="h-9 text-sm"
                    value={item.preco_unitario}
                    onChange={e => updateItem(item.id, 'preco_unitario', e.target.value)}
                    placeholder="0,00"
                  />

                  <span className="text-sm font-medium text-gray-700">{fmt(subtotal)}</span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="h-9 w-8 flex items-center justify-center text-gray-300 hover:text-red-500 disabled:opacity-20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}

            <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-1">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Adicionar Item
            </Button>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 mt-2 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{fmt(total)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Desconto (R$)</span>
                <Input
                  type="number" min="0" step="0.01"
                  className="h-7 w-28 text-sm text-right"
                  value={desconto}
                  onChange={e => setDesconto(e.target.value)}
                />
              </div>
              <div className="flex justify-between text-base font-semibold border-t border-gray-100 pt-2">
                <span>Total Final</span>
                <span className="text-green-600">{fmt(totalFinal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagamentos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pagamentos</CardTitle>
              {pagamentos.length > 0 && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  Math.abs(diferenca) < 0.01
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : diferenca < 0
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                  {fmt(totalPago)} / {fmt(totalFinal)}
                  {Math.abs(diferenca) >= 0.01 && (diferenca > 0 ? ` · troco ${fmt(diferenca)}` : ` · falta ${fmt(-diferenca)}`)}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Gerador de parcelamento */}
            <div className="flex gap-2 items-end p-3 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-xs">Parcelas</Label>
                <Input
                  type="number" min="1" max="12"
                  className="h-8 w-20 text-sm"
                  value={nParcelas}
                  onChange={e => setNParcelas(e.target.value)}
                />
              </div>
              <div className="space-y-1 w-36">
                <Label className="text-xs">Pagamento</Label>
                <Select value={formaParcela} onValueChange={v => setFormaParcela(v ?? 'pix')}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">1º vencimento</Label>
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={gerarParcelamento}>
                Gerar
              </Button>
            </div>

            {pagamentos.length > 0 && (
              <div className="space-y-2">
                <div className="hidden md:grid md:grid-cols-[1fr_110px_140px_32px] gap-2 px-0.5">
                  {['Forma de Pagamento', 'Valor (R$)', 'Vencimento', ''].map(h => (
                    <span key={h} className="text-xs text-gray-400 font-medium">{h}</span>
                  ))}
                </div>
                {pagamentos.map(pag => (
                  <div key={pag.id} className="grid grid-cols-[1fr_110px_140px_32px] gap-2 items-center">
                    <Select
                      key={`fp-${pag.id}`}
                      value={pag.forma_pagamento}
                      onValueChange={v => updatePag(pag.id, 'forma_pagamento', v ?? '')}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="credito">Crédito</SelectItem>
                        <SelectItem value="debito">Débito</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number" min="0.01" step="0.01"
                      className="h-9 text-sm"
                      value={pag.valor}
                      onChange={e => updatePag(pag.id, 'valor', e.target.value)}
                    />
                    <Input
                      type="date"
                      className="h-9 text-sm"
                      value={pag.data_vencimento}
                      onChange={e => updatePag(pag.id, 'data_vencimento', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removePag(pag.id)}
                      className="h-9 w-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button type="button" variant="outline" size="sm" onClick={addPag}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Adicionar Pagamento Avulso
            </Button>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pb-6">
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Criar Venda'}
          </Button>
          <Link href="/vendas" className={buttonVariants({ variant: 'outline' })}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}

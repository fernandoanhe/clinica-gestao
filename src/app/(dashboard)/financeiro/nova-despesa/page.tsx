'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

const CATEGORIAS = ['Aluguel', 'Fornecedor', 'Salário', 'Marketing', 'Material', 'Outros']

export default function NovaDespesaPage() {
  const router = useRouter()
  const hoje = new Date().toISOString().split('T')[0]

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(hoje)
  const [categoria, setCategoria] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!descricao.trim()) { setError('Descrição é obrigatória.'); return }
    if (!valor || Number(valor) <= 0) { setError('Valor deve ser maior que zero.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('transacoes').insert({
      tipo: 'despesa',
      descricao: observacoes ? `${descricao.trim()} — ${observacoes.trim()}` : descricao.trim(),
      valor: Number(valor),
      data: data || hoje,
      categoria: categoria || null,
      forma_pagamento: formaPagamento || null,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    router.push('/financeiro')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/financeiro" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-800">Nova Despesa</h1>
      </div>

      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição <span className="text-red-500">*</span></Label>
              <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Pagamento de aluguel..." autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) <span className="text-red-500">*</span></Label>
                <Input type="number" min="0.01" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={data} onChange={e => setData(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label>Observações</Label>
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Detalhes adicionais (serão anexados à descrição)..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Lançar Despesa'}</Button>
              <Link href="/financeiro" className={buttonVariants({ variant: 'outline' })}>Cancelar</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

export default function EditarProdutoPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [unidade, setUnidade] = useState('')
  const [quantidadeAtual, setQuantidadeAtual] = useState(0)
  const [quantidadeMinima, setQuantidadeMinima] = useState('')
  const [custoUnitario, setCustoUnitario] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('produtos').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setNome(data.nome)
        setDescricao(data.descricao ?? '')
        setCategoria(data.categoria ?? '')
        setUnidade(data.unidade)
        setQuantidadeAtual(data.quantidade_atual)
        setQuantidadeMinima(String(data.quantidade_minima))
        setCustoUnitario(String(data.custo_unitario))
      }
      setLoadingData(false)
    })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!nome.trim()) { setError('Nome é obrigatório.'); return }
    if (!unidade) { setError('Unidade é obrigatória.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('produtos').update({
      nome: nome.trim(),
      descricao: descricao || null,
      categoria: categoria || null,
      unidade,
      quantidade_minima: Number(quantidadeMinima) || 0,
      custo_unitario: Number(custoUnitario) || 0,
    }).eq('id', id)
    setLoading(false)
    if (err) { setError(err.message); return }
    router.push('/estoque')
  }

  if (loadingData) {
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
          <Link href="/estoque"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800">Editar Produto</h1>
      </div>

      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome <span className="text-red-500">*</span></Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do produto" />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                rows={2}
                placeholder="Descrição opcional..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ex: Consumível..." />
              </div>
              <div className="space-y-2">
                <Label>Unidade <span className="text-red-500">*</span></Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">un — unidade</SelectItem>
                    <SelectItem value="ml">ml — mililitro</SelectItem>
                    <SelectItem value="g">g — grama</SelectItem>
                    <SelectItem value="cx">cx — caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Qtd Atual</Label>
                <Input
                  value={quantidadeAtual}
                  readOnly
                  className="bg-gray-50 text-gray-500 cursor-default"
                />
                <p className="text-xs text-gray-400">Use "Entrada" para alterar</p>
              </div>
              <div className="space-y-2">
                <Label>Qtd Mínima</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantidadeMinima}
                  onChange={e => setQuantidadeMinima(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Custo Unit. (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={custoUnitario}
                  onChange={e => setCustoUnitario(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/estoque">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

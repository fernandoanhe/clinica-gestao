'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Produto } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Package } from 'lucide-react'

export default function EntradaEstoquePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [produto, setProduto] = useState<Produto | null>(null)
  const [quantidade, setQuantidade] = useState('')
  const [custoUnitario, setCustoUnitario] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('produtos').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setProduto(data as Produto)
        setCustoUnitario(String(data.custo_unitario))
      }
    })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const qtd = Number(quantidade)
    if (!qtd || qtd <= 0) { setError('Quantidade deve ser maior que zero.'); return }
    if (!produto) return

    setLoading(true)
    const supabase = createClient()

    const { error: errMov } = await supabase.from('movimentacoes_estoque').insert({
      produto_id: id,
      tipo: 'entrada',
      quantidade: qtd,
      custo_unitario: custoUnitario ? Number(custoUnitario) : null,
      motivo: motivo || null,
    })

    if (errMov) { setError(errMov.message); setLoading(false); return }

    const { error: errProd } = await supabase.from('produtos')
      .update({ quantidade_atual: produto.quantidade_atual + qtd })
      .eq('id', id)

    setLoading(false)
    if (errProd) { setError(errProd.message); return }
    router.push('/estoque')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/estoque"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800">Entrada de Estoque</h1>
      </div>

      {produto && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-lg">
          <Package className="h-5 w-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">{produto.nome}</p>
            <p className="text-xs text-gray-500">
              Estoque atual: <span className="font-medium">{produto.quantidade_atual} {produto.unidade}</span>
              {produto.categoria && ` · ${produto.categoria}`}
            </p>
          </div>
        </div>
      )}

      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Quantidade que está entrando <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
                placeholder="0"
                autoFocus
              />
              {produto && quantidade && Number(quantidade) > 0 && (
                <p className="text-xs text-gray-500">
                  Novo estoque: {produto.quantidade_atual + Number(quantidade)} {produto.unidade}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Custo Unitário (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={custoUnitario}
                onChange={e => setCustoUnitario(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ex: Compra fornecedor, Reposição..."
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading || !produto}>
                {loading ? 'Registrando...' : 'Registrar Entrada'}
              </Button>
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

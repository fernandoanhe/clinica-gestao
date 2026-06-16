'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function NovoServicoPage() {
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [duracaoMinutos, setDuracaoMinutos] = useState('')
  const [preco, setPreco] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!nome.trim()) { setError('Nome é obrigatório.'); return }
    if (!duracaoMinutos || !preco) { setError('Duração e preço são obrigatórios.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('servicos').insert({
      nome: nome.trim(),
      descricao: descricao || null,
      duracao_minutos: Number(duracaoMinutos),
      preco: Number(preco),
      ativo: true,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    router.push('/servicos')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/servicos"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800">Novo Serviço</h1>
      </div>

      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome <span className="text-red-500">*</span></Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Fisioterapia, Pilates..." />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                rows={3}
                placeholder="Descrição do serviço..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duração (min) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min="1"
                  value={duracaoMinutos}
                  onChange={e => setDuracaoMinutos(e.target.value)}
                  placeholder="60"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço (R$) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={preco}
                  onChange={e => setPreco(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/servicos">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

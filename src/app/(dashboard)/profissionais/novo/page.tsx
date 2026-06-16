'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function NovoProfissionalPage() {
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!nome.trim()) { setError('Nome é obrigatório.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('profissionais').insert({
      nome: nome.trim(),
      especialidade: especialidade || null,
      telefone: telefone || null,
      email: email || null,
      ativo: true,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    router.push('/profissionais')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profissionais" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-800">Novo Profissional</h1>
      </div>

      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome <span className="text-red-500">*</span></Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Input value={especialidade} onChange={e => setEspecialidade(e.target.value)} placeholder="Ex: Fisioterapia, Nutrição..." />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
              <Link href="/profissionais" className={buttonVariants({ variant: 'outline' })}>Cancelar</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

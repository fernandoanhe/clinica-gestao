'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Cliente, Profissional } from '@/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

export default function NovoAgendamentoPage() {
  const router = useRouter()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])

  const [clienteId, setClienteId] = useState('')
  const [clienteQuery, setClienteQuery] = useState('')
  const [clienteOpen, setClienteOpen] = useState(false)
  const [profissionalId, setProfissionalId] = useState('')
  const [servico, setServico] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('clientes').select('*').eq('ativo', true).order('nome'),
      supabase.from('profissionais').select('*').eq('ativo', true).order('nome'),
    ]).then(([{ data: c }, { data: p }]) => {
      setClientes((c ?? []) as Cliente[])
      setProfissionais((p ?? []) as Profissional[])
    })
  }, [])

  const clienteSelecionado = clientes.find(c => c.id === clienteId)
  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(clienteQuery.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!clienteId || !profissionalId || !data || !hora) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('agendamentos').insert({
      cliente_id: clienteId,
      profissional_id: profissionalId,
      servico_realizado: servico || null,
      data_hora: `${data}T${hora}:00`,
      status: 'agendado',
      valor_cobrado: 0,
      observacoes: observacoes || null,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    router.push('/agendamentos')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/agendamentos" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-800">Novo Agendamento</h1>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Cliente com busca */}
            <div className="space-y-2">
              <Label>Cliente <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  placeholder="Buscar cliente pelo nome..."
                  value={clienteSelecionado ? clienteSelecionado.nome : clienteQuery}
                  onChange={e => {
                    setClienteQuery(e.target.value)
                    setClienteId('')
                    setClienteOpen(true)
                  }}
                  onFocus={() => setClienteOpen(true)}
                  onBlur={() => setTimeout(() => setClienteOpen(false), 150)}
                  autoComplete="off"
                />
                {clienteOpen && clientesFiltrados.length > 0 && (
                  <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                    {clientesFiltrados.map(c => (
                      <li
                        key={c.id}
                        onMouseDown={() => {
                          setClienteId(c.id)
                          setClienteQuery('')
                          setClienteOpen(false)
                        }}
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

            {/* Profissional */}
            <div className="space-y-2">
              <Label>Profissional <span className="text-red-500">*</span></Label>
              <Select value={profissionalId} onValueChange={v => setProfissionalId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional..." />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}{p.especialidade ? ` — ${p.especialidade}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Serviço — texto livre */}
            <div className="space-y-2">
              <Label>Serviço</Label>
              <Input
                placeholder="Ex: Harmonização facial, limpeza de pele, massagem..."
                value={servico}
                onChange={e => setServico(e.target.value)}
              />
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data <span className="text-red-500">*</span></Label>
                <Input type="date" value={data} onChange={e => setData(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hora <span className="text-red-500">*</span></Label>
                <Input type="time" value={hora} onChange={e => setHora(e.target.value)} />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Observações opcionais..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Agendamento'}
              </Button>
              <Link href="/agendamentos" className={buttonVariants({ variant: 'outline' })}>Cancelar</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

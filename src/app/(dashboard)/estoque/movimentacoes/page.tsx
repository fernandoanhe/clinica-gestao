import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'
import type { MovimentacaoEstoque } from '@/types'

const TIPO_COLORS: Record<string, string> = {
  entrada: 'bg-green-100 text-green-700 border-green-200',
  saida:   'bg-red-100 text-red-700 border-red-200',
  ajuste:  'bg-blue-100 text-blue-700 border-blue-200',
}

const TIPO_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  saida:   'Saída',
  ajuste:  'Ajuste',
}

export default async function MovimentacoesPage() {
  const supabase = await createClient()
  const { data: movimentacoes } = await supabase
    .from('movimentacoes_estoque')
    .select('*, produto:produtos(nome, unidade)')
    .order('created_at', { ascending: false })

  const lista = (movimentacoes ?? []) as MovimentacaoEstoque[]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/estoque" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-800">Movimentações de Estoque</h1>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Custo Unit.</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                  Nenhuma movimentação registrada.
                </TableCell>
              </TableRow>
            ) : lista.map(m => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(m.created_at).toLocaleDateString('pt-BR')}{' '}
                  <span className="text-gray-500">
                    {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{m.produto?.nome ?? '—'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${TIPO_COLORS[m.tipo] ?? ''}`}>
                    {TIPO_LABELS[m.tipo] ?? m.tipo}
                  </span>
                </TableCell>
                <TableCell>
                  {m.quantidade}
                  {m.produto && (
                    <span className="text-gray-400 ml-1 text-xs">
                      {(m.produto as MovimentacaoEstoque['produto'] & { unidade?: string })?.unidade}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {m.custo_unitario != null ? `R$ ${Number(m.custo_unitario).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">{m.motivo ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

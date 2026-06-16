import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, AlertTriangle, ClipboardList } from 'lucide-react'
import type { Produto } from '@/types'

export default async function EstoquePage() {
  const supabase = await createClient()
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  const lista = (produtos ?? []) as Produto[]
  const criticos = lista.filter(p => p.quantidade_atual <= p.quantidade_minima)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Estoque</h1>
        <div className="flex gap-2">
          <Link href="/estoque/movimentacoes" className={buttonVariants({ variant: 'outline' })}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Movimentações
          </Link>
          <Link href="/estoque/novo" className={buttonVariants()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Link>
        </div>
      </div>

      {criticos.length > 0 && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 ml-2">
            <span className="font-semibold">{criticos.length} produto(s) com estoque crítico: </span>
            {criticos.map(p => p.nome).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Qtd Atual</TableHead>
              <TableHead>Qtd Mínima</TableHead>
              <TableHead>Custo Unit.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-gray-400">
                  Nenhum produto cadastrado.
                </TableCell>
              </TableRow>
            ) : lista.map(p => {
              const critico = p.quantidade_atual <= p.quantidade_minima
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell>{p.categoria ?? '—'}</TableCell>
                  <TableCell>{p.unidade}</TableCell>
                  <TableCell className={critico ? 'text-red-600 font-semibold' : ''}>{p.quantidade_atual}</TableCell>
                  <TableCell>{p.quantidade_minima}</TableCell>
                  <TableCell>R$ {Number(p.custo_unitario).toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${
                      critico
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-green-100 text-green-700 border-green-200'
                    }`}>
                      {critico ? 'Estoque Crítico' : 'Estoque OK'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/estoque/${p.id}/entrada`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        Entrada
                      </Link>
                      <Link href={`/estoque/${p.id}/editar`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        Editar
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

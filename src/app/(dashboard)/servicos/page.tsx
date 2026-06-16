import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import type { Servico } from '@/types'

export default async function ServicosPage() {
  const supabase = await createClient()
  const { data: servicos } = await supabase
    .from('servicos')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Serviços</h1>
        <Link href="/servicos/novo" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Link>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Preço</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!servicos || servicos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-gray-400">
                  Nenhum serviço cadastrado.
                </TableCell>
              </TableRow>
            ) : (servicos as Servico[]).map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.nome}</TableCell>
                <TableCell className="text-gray-500 max-w-xs truncate">{s.descricao ?? '—'}</TableCell>
                <TableCell>{s.duracao_minutos} min</TableCell>
                <TableCell>R$ {Number(s.preco).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

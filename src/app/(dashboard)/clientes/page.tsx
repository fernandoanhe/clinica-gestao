import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import type { Cliente } from '@/types'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Clientes</h1>
        <Button asChild>
          <Link href="/clientes/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Nascimento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!clientes || clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-gray-400">
                  Nenhum cliente cadastrado.
                </TableCell>
              </TableRow>
            ) : (clientes as Cliente[]).map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.telefone ?? '—'}</TableCell>
                <TableCell>{c.email ?? '—'}</TableCell>
                <TableCell>
                  {c.data_nascimento
                    ? new Date(c.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

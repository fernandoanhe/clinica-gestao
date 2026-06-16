import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import type { Profissional } from '@/types'

export default async function ProfissionaisPage() {
  const supabase = await createClient()
  const { data: profissionais } = await supabase
    .from('profissionais')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Profissionais</h1>
        <Link href="/profissionais/novo" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Profissional
        </Link>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!profissionais || profissionais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-gray-400">
                  Nenhum profissional cadastrado.
                </TableCell>
              </TableRow>
            ) : (profissionais as Profissional[]).map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell>{p.especialidade ?? '—'}</TableCell>
                <TableCell>{p.telefone ?? '—'}</TableCell>
                <TableCell>{p.email ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

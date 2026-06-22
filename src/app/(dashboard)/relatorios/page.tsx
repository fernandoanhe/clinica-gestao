import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Target, Star, Package, Users, CalendarCheck, ChevronRight } from 'lucide-react'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default async function RelatoriosPage() {
  const supabase = await createClient()

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth() + 1
  const mesStr = mes.toString().padStart(2, '0')
  const inicioMes = `${ano}-${mesStr}-01`
  const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0]
  const inicioMesTs = `${inicioMes}T00:00:00`
  const fimMesTs = `${fimMes}T23:59:59`
  const nomeMes = hoje.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  const [
    { data: transacoesAtend },
    { data: agendamentos },
    { data: movimentacoes },
    { count: totalClientes },
  ] = await Promise.all([
    supabase
      .from('transacoes')
      .select('valor')
      .eq('tipo', 'receita')
      .eq('categoria', 'Atendimento')
      .gte('data', inicioMes)
      .lte('data', fimMes),
    supabase
      .from('agendamentos')
      .select('servico_id, valor_cobrado, servico:servicos(nome)')
      .eq('status', 'concluido')
      .gte('data_hora', inicioMesTs)
      .lte('data_hora', fimMesTs),
    supabase
      .from('movimentacoes_estoque')
      .select('produto_id, quantidade, custo_unitario, produto:produtos(nome, custo_unitario)')
      .eq('tipo', 'saida')
      .gte('created_at', inicioMesTs)
      .lte('created_at', fimMesTs),
    supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true),
  ])

  // Ticket médio
  const nAtend = transacoesAtend?.length ?? 0
  const totalAtend = transacoesAtend?.reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const ticketMedio = nAtend > 0 ? totalAtend / nAtend : 0

  // Ranking de serviços
  type ServicoAcc = { nome: string; count: number; receita: number }
  const servicosMap: Record<string, ServicoAcc> = {}

  agendamentos?.forEach(a => {
    const id = a.servico_id as string
    const servico = (a.servico as unknown) as { nome: string } | null
    const nome = servico?.nome ?? 'Desconhecido'
    if (!servicosMap[id]) servicosMap[id] = { nome, count: 0, receita: 0 }
    servicosMap[id].count++
    servicosMap[id].receita += Number(a.valor_cobrado)
  })

  const rankingServicos = Object.values(servicosMap).sort((a, b) => b.count - a.count)

  // Produtos consumidos
  type ProdutoAcc = { nome: string; quantidade: number; custoTotal: number }
  const produtosMap: Record<string, ProdutoAcc> = {}

  movimentacoes?.forEach(m => {
    const id = m.produto_id as string
    const produto = (m.produto as unknown) as { nome: string; custo_unitario: number } | null
    const nome = produto?.nome ?? 'Desconhecido'
    const custo = Number(m.custo_unitario ?? produto?.custo_unitario ?? 0)
    if (!produtosMap[id]) produtosMap[id] = { nome, quantidade: 0, custoTotal: 0 }
    produtosMap[id].quantidade += Number(m.quantidade)
    produtosMap[id].custoTotal += Number(m.quantidade) * custo
  })

  const rankingProdutos = Object.values(produtosMap).sort((a, b) => b.quantidade - a.quantidade)

  const servicoTopo = rankingServicos[0]
  const produtoTopo = rankingProdutos[0]

  const cards = [
    {
      title: 'Ticket Médio do Mês',
      value: fmt(ticketMedio),
      sub: nAtend > 0 ? `${nAtend} atendimento${nAtend > 1 ? 's' : ''} via sistema` : 'Sem atendimentos via sistema',
      icon: Target,
      color: 'text-blue-600',
    },
    {
      title: 'Serviço Mais Realizado',
      value: servicoTopo?.nome ?? '—',
      sub: servicoTopo
        ? `${servicoTopo.count} realização${servicoTopo.count > 1 ? 'ões' : ''} · ${fmt(servicoTopo.receita)}`
        : 'Nenhum concluído no mês',
      icon: Star,
      color: 'text-yellow-500',
    },
    {
      title: 'Produto Mais Consumido',
      value: produtoTopo?.nome ?? '—',
      sub: produtoTopo
        ? `${produtoTopo.quantidade} unid. · custo ${fmt(produtoTopo.custoTotal)}`
        : 'Nenhuma saída no mês',
      icon: Package,
      color: 'text-orange-500',
    },
    {
      title: 'Clientes Ativos',
      value: String(totalClientes ?? 0),
      sub: 'Total cadastrado e ativo',
      icon: Users,
      color: 'text-green-600',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">{nomeMes}</p>
      </div>

      {/* Análises detalhadas */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Análises</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <Link href="/relatorios/agendamentos">
            <Card className="hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <span className="p-2.5 rounded-lg bg-blue-50 shrink-0">
                  <CalendarCheck className="h-5 w-5 text-blue-600" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Análise de Agendamentos</p>
                  <p className="text-xs text-gray-400 mt-0.5">Histórico completo · tendências · procedimentos</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map(({ title, value, sub, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-semibold truncate ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Ranking de Serviços — {nomeMes}
          </h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-center">Realizações</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingServicos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                      Nenhum serviço concluído no mês.
                    </TableCell>
                  </TableRow>
                ) : rankingServicos.map((s, idx) => (
                  <TableRow key={s.nome}>
                    <TableCell className="text-gray-400 font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                        {s.count}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">{fmt(s.receita)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Produtos Consumidos — {nomeMes}
          </h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd Saída</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingProdutos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                      Nenhuma saída de estoque no mês.
                    </TableCell>
                  </TableRow>
                ) : rankingProdutos.map((p, idx) => (
                  <TableRow key={p.nome}>
                    <TableCell className="text-gray-400 font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                        {p.quantidade % 1 === 0 ? p.quantidade : p.quantidade.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-red-500 font-medium">{fmt(p.custoTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  )
}

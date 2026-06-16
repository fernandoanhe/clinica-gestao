import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, TrendingUp, TrendingDown, Package, DollarSign } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
  const inicioHoje = new Date(hoje.setHours(0,0,0,0)).toISOString()
  const fimHoje = new Date(hoje.setHours(23,59,59,999)).toISOString()

  const [{ data: receitas }, { data: despesas }, { data: agendamentosHoje }, { data: produtosBaixos }] =
    await Promise.all([
      supabase.from('transacoes').select('valor').eq('tipo', 'receita').gte('data', inicioMes).lte('data', fimMes),
      supabase.from('transacoes').select('valor').eq('tipo', 'despesa').gte('data', inicioMes).lte('data', fimMes),
      supabase.from('agendamentos').select('id').in('status', ['agendado','confirmado']).gte('data_hora', inicioHoje).lte('data_hora', fimHoje),
      supabase.from('produtos').select('id').lte('quantidade_atual', 'quantidade_minima').eq('ativo', true),
    ])

  const totalReceitas = receitas?.reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const totalDespesas = despesas?.reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const lucro = totalReceitas - totalDespesas

  const stats = [
    { title: 'Receita do Mês', value: `R$ ${totalReceitas.toFixed(2)}`, icon: TrendingUp, color: 'text-green-600' },
    { title: 'Despesas do Mês', value: `R$ ${totalDespesas.toFixed(2)}`, icon: TrendingDown, color: 'text-red-500' },
    { title: 'Lucro do Mês', value: `R$ ${lucro.toFixed(2)}`, icon: DollarSign, color: lucro >= 0 ? 'text-green-600' : 'text-red-500' },
    { title: 'Agendamentos Hoje', value: String(agendamentosHoje?.length ?? 0), icon: CalendarDays, color: 'text-blue-600' },
    { title: 'Estoque Crítico', value: String(produtosBaixos?.length ?? 0), icon: Package, color: 'text-orange-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Painel Geral</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

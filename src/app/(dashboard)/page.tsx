import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, TrendingUp, TrendingDown, Package, DollarSign, ShoppingBag } from 'lucide-react'

// America/Sao_Paulo is always UTC-3 (Brazil abolished DST in 2019)
const SP_OFFSET_MS = -3 * 60 * 60 * 1000

function spDate(utcDate: Date): Date {
  return new Date(utcDate.getTime() + SP_OFFSET_MS)
}

function toSpISOStart(y: number, m: number, d: number): string {
  // midnight in São Paulo = UTC+3h on that same date
  return new Date(Date.UTC(y, m, d, 3, 0, 0, 0)).toISOString()
}

function toSpISOEnd(y: number, m: number, d: number): string {
  // 23:59:59.999 in São Paulo = next day 02:59:59.999 UTC
  return new Date(Date.UTC(y, m, d + 1, 2, 59, 59, 999)).toISOString()
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const sp = spDate(now)
  const y = sp.getUTCFullYear()
  const m = sp.getUTCMonth()
  const d = sp.getUTCDate()

  // transacoes.data is a DATE column (YYYY-MM-DD) so plain string comparison is fine
  const inicioMes = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const ultimoDia = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const fimMes = `${y}-${String(m + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

  // agendamentos.data_hora is a timestamptz — compare in UTC, accounting for SP timezone
  const inicioHoje = toSpISOStart(y, m, d)
  const fimHoje = toSpISOEnd(y, m, d)

  const [
    { data: receitas },
    { data: despesas },
    { data: agendamentosHoje },
    { data: estoqueCritico },
    { data: vendasReceber },
  ] = await Promise.all([
    supabase.from('transacoes').select('valor').eq('tipo', 'receita').gte('data', inicioMes).lte('data', fimMes),
    supabase.from('transacoes').select('valor').eq('tipo', 'despesa').gte('data', inicioMes).lte('data', fimMes),
    supabase.from('agendamentos').select('id').in('status', ['agendado', 'confirmado']).gte('data_hora', inicioHoje).lte('data_hora', fimHoje),
    supabase.rpc('get_produtos_estoque_critico'),
    supabase.rpc('get_vendas_a_receber'),
  ])

  const totalReceitas = receitas?.reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const totalDespesas = despesas?.reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const lucro = totalReceitas - totalDespesas
  const qtdEstoqueCritico = Number(estoqueCritico ?? 0)
  const totalVendasReceber = Number(vendasReceber ?? 0)

  const stats = [
    { title: 'Receita do Mês',      value: `R$ ${totalReceitas.toFixed(2)}`,      icon: TrendingUp,  color: 'text-green-600' },
    { title: 'Despesas do Mês',     value: `R$ ${totalDespesas.toFixed(2)}`,      icon: TrendingDown, color: 'text-red-500' },
    { title: 'Lucro do Mês',        value: `R$ ${lucro.toFixed(2)}`,              icon: DollarSign,  color: lucro >= 0 ? 'text-green-600' : 'text-red-500' },
    { title: 'Agendamentos Hoje',   value: String(agendamentosHoje?.length ?? 0), icon: CalendarDays, color: 'text-blue-600' },
    { title: 'Estoque Crítico',     value: String(qtdEstoqueCritico),             icon: Package,     color: 'text-orange-500' },
    { title: 'Vendas a Receber',    value: `R$ ${totalVendasReceber.toFixed(2)}`, icon: ShoppingBag, color: 'text-purple-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Painel Geral</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

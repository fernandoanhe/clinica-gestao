import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import GraficoAgendamentosFaturamento, { type DadosMes } from '@/components/relatorios/GraficoAgendamentosFaturamento'

const MESES_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

function mesLabel(year: number, month: number) {
  return `${MESES_PT[month].charAt(0).toUpperCase() + MESES_PT[month].slice(1)}/${String(year).slice(2)}`
}
function mesKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export default async function AgendamentosFaturamentoPage() {
  const supabase = await createClient()

  const [{ data: agendamentos }, { data: transacoes }] = await Promise.all([
    supabase
      .from('agendamentos')
      .select('data_hora, status'),
    supabase
      .from('transacoes')
      .select('data, valor')
      .eq('tipo', 'receita')
      .eq('categoria', 'Atendimento'),
  ])

  // ── Agrupar agendamentos por mês ──────────────────────────────────────
  type MesEntry = { agendamentos: number; concluidos: number }
  const agMap = new Map<string, MesEntry>()

  for (const a of agendamentos ?? []) {
    if (!a.data_hora) continue
    // Extrair mês/ano em BRT a partir do timestamp UTC
    const dt = new Date(a.data_hora)
    const brt = new Date(dt.getTime() - 3 * 60 * 60 * 1000)
    const key = mesKey(brt.getUTCFullYear(), brt.getUTCMonth())
    const entry = agMap.get(key) ?? { agendamentos: 0, concluidos: 0 }
    entry.agendamentos++
    if (a.status === 'concluido') entry.concluidos++
    agMap.set(key, entry)
  }

  // ── Agrupar transações por mês ────────────────────────────────────────
  const fatMap = new Map<string, number>()

  for (const t of transacoes ?? []) {
    if (!t.data) continue
    // t.data é "YYYY-MM-DD" — usar diretamente
    const [year, monthStr] = t.data.split('-')
    const key = `${year}-${monthStr}`
    fatMap.set(key, (fatMap.get(key) ?? 0) + Number(t.valor))
  }

  // ── Unir todas as chaves em ordem cronológica ─────────────────────────
  const allKeys = [...new Set([...agMap.keys(), ...fatMap.keys()])].sort()

  const dados: DadosMes[] = allKeys.map(key => {
    const [y, m] = key.split('-').map(Number)
    const ag = agMap.get(key) ?? { agendamentos: 0, concluidos: 0 }
    const fat = fatMap.get(key) ?? 0
    return {
      mes: mesLabel(y, m - 1),
      agendamentos: ag.agendamentos,
      concluidos: ag.concluidos,
      outros: ag.agendamentos - ag.concluidos,
      faturamento: Math.round(fat * 100) / 100,
    }
  })

  const totalAg  = dados.reduce((s, d) => s + d.agendamentos, 0)
  const totalFat = dados.reduce((s, d) => s + d.faturamento,  0)

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/relatorios" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Agendamentos × Faturamento</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalAg} agendamentos · {fmt(totalFat)} em atendimentos · {dados.length} meses
          </p>
        </div>
      </div>

      <GraficoAgendamentosFaturamento dados={dados} />
    </div>
  )
}

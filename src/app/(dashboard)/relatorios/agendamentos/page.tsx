import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import GraficosAgendamentos from '@/components/agendamentos/GraficosAgendamentos'

const MESES_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

function mesLabel(year: number, month: number) {
  return `${MESES_PT[month]}/${String(year).slice(2)}`
}

function mesKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export default async function RelatorioAgendamentosPage() {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('agendamentos')
    .select('id, data_hora, status, servico_realizado')
    .order('data_hora', { ascending: true })

  const agendamentos = raw ?? []

  // ── Cards ──────────────────────────────────────────────────────────────
  const total       = agendamentos.length
  const concluidos  = agendamentos.filter(a => a.status === 'concluido').length
  const cancelados  = agendamentos.filter(a => a.status === 'cancelado').length
  const agendadosN  = agendamentos.filter(a => a.status === 'agendado').length
  const taxaBase    = total - agendadosN
  const taxaComparecimento = taxaBase > 0 ? (concluidos / taxaBase) * 100 : 0

  // ── Dados por mês ──────────────────────────────────────────────────────
  type MesEntry = { concluido: number; confirmado: number; cancelado: number; agendado: number }
  const monthMap = new Map<string, MesEntry>()

  for (const a of agendamentos) {
    if (!a.data_hora) continue
    const dt    = new Date(a.data_hora)
    const year  = dt.getUTCFullYear()
    const month = dt.getUTCMonth()
    const key   = mesKey(year, month)

    if (!monthMap.has(key)) {
      monthMap.set(key, { concluido: 0, confirmado: 0, cancelado: 0, agendado: 0 })
    }
    const entry = monthMap.get(key)!
    const s = a.status as keyof MesEntry
    if (s in entry) entry[s]++
  }

  const dadosMes = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, counts]) => {
      const [y, m] = key.split('-').map(Number)
      return { mes: mesLabel(y, m - 1), ...counts }
    })

  // ── Tendência (apenas concluídos) ───────────────────────────────────────
  const dadosTendencia = dadosMes.map(d => ({ mes: d.mes, total: d.concluido }))

  // ── Procedimentos (status=concluido) ───────────────────────────────────
  const procMap = new Map<string, number>()
  for (const a of agendamentos) {
    if (a.status !== 'concluido') continue
    const nome = (a.servico_realizado ?? '').trim() || 'Não informado'
    procMap.set(nome, (procMap.get(nome) ?? 0) + 1)
  }

  const totalConcluidosProcedimentos = concluidos || 1
  const procOrdenado = [...procMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([nome, quantidade]) => ({
      nome,
      quantidade,
      percentual: (quantidade / totalConcluidosProcedimentos) * 100,
    }))

  const dadosPizza   = procOrdenado.slice(0, 10)
  const dadosRanking = procOrdenado.slice(0, 15)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/relatorios"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Análise de Agendamentos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} agendamentos · histórico completo
          </p>
        </div>
      </div>

      <GraficosAgendamentos
        cards={{ total, concluidos, cancelados, taxaComparecimento }}
        dadosMes={dadosMes}
        dadosTendencia={dadosTendencia}
        dadosPizza={dadosPizza}
        dadosRanking={dadosRanking}
      />
    </div>
  )
}

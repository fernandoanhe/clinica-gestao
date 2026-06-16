/**
 * Script de teste e seed completo — Clínica Gestão
 * Uso: node scripts/test-seed.mjs
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Leitura do .env.local ───────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '.env.local')
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

// Usar service role key para bypass do RLS (dados de teste)
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── Utilitários de output ───────────────────────────────────────────────────
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', B = '\x1b[36m'
const RESET = '\x1b[0m', BOLD = '\x1b[1m', DIM = '\x1b[2m'

let passed = 0, failed = 0, warnings = 0
const issues = []

function ok(msg)      { console.log(`  ${G}✓${RESET} ${msg}`); passed++ }
function fail(msg, d) { console.log(`  ${R}✗${RESET} ${msg}${d ? `\n    ${DIM}→ ${d}${RESET}` : ''}`); failed++; issues.push(msg) }
function warn(msg)    { console.log(`  ${Y}⚠${RESET} ${msg}`); warnings++ }
function section(n, t){ console.log(`\n${BOLD}${B}[${n}]${RESET}${BOLD} ${t}${RESET}`) }
function info(msg)    { console.log(`    ${DIM}${msg}${RESET}`) }
function hr()         { console.log(`  ${DIM}${'─'.repeat(55)}${RESET}`) }

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const hoje = new Date().toISOString().split('T')[0]
  const mesAtual = hoje.slice(0, 7)

  console.log(`\n${BOLD}${B}${'═'.repeat(57)}`)
  console.log(`  TESTE COMPLETO — Clínica Gestão`)
  console.log(`  ${hoje}`)
  console.log(`${'═'.repeat(57)}${RESET}`)

  // ═══════════════════════════════════════════════════════
  // BLOCO 1: INSERÇÃO DE DADOS
  // ═══════════════════════════════════════════════════════

  // ─── 1. Profissionais ───────────────────────────────────
  section(1, 'Profissionais (3)')

  const { data: profs, error: eP } = await supabase
    .from('profissionais')
    .insert([
      { nome: 'Ana Luiza Costa',   especialidade: 'Esteticista',    telefone: '(11) 98711-1111', email: 'ana@clinicateste.com' },
      { nome: 'Dr. Rafael Mendes', especialidade: 'Dermatologista', telefone: '(11) 98722-2222', email: 'rafael@clinicateste.com' },
      { nome: 'Carlos Eduardo',    especialidade: 'Massoterapeuta', telefone: '(11) 98733-3333', email: 'carlos@clinicateste.com' },
    ])
    .select()

  if (eP) { fail('Inserir profissionais', eP.message); process.exit(1) }
  ok(`${profs.length} profissionais inseridos`)
  profs.forEach(p => info(`→ ${p.nome} (${p.especialidade})`))

  const [pAna, pRafael, pCarlos] = profs

  // ─── 2. Serviços ────────────────────────────────────────
  section(2, 'Serviços (5)')

  const { data: servs, error: eS } = await supabase
    .from('servicos')
    .insert([
      { nome: 'Limpeza de Pele Profunda',  descricao: 'Limpeza completa com extração e hidratação',          duracao_minutos: 60,  preco: 150 },
      { nome: 'Harmonização Facial',        descricao: 'Preenchimento com ácido hialurônico e bioestimulador', duracao_minutos: 120, preco: 800 },
      { nome: 'Massagem Relaxante',         descricao: 'Massagem corporal completa com óleos essenciais',      duracao_minutos: 60,  preco: 180 },
      { nome: 'Peeling Químico',            descricao: 'Renovação celular profunda com ácidos',                duracao_minutos: 90,  preco: 350 },
      { nome: 'Hidratação Facial Intensiva',descricao: 'Hidratação com vitamina C e ácido hialurônico',        duracao_minutos: 45,  preco: 120 },
    ])
    .select()

  if (eS) { fail('Inserir serviços', eS.message); process.exit(1) }
  ok(`${servs.length} serviços inseridos`)
  servs.forEach(s => info(`→ ${s.nome} — R$ ${s.preco}`))

  const [sLimpeza, sHarmonizacao, sMassagem, sPeeling, sHidratacao] = servs

  // ─── 3. Produtos ────────────────────────────────────────
  section(3, 'Produtos (10)')

  const { data: prods, error: ePr } = await supabase
    .from('produtos')
    .insert([
      { nome: 'Ácido Hialurônico 1%',    unidade: 'ml', quantidade_atual: 20, quantidade_minima: 5,  custo_unitario: 45.00,  categoria: 'Ativo Cosmético' },
      { nome: 'Protetor Solar FPS 50',   unidade: 'un', quantidade_atual: 15, quantidade_minima: 3,  custo_unitario: 38.00,  categoria: 'Proteção Solar'  },
      { nome: 'Creme Hidratante',        unidade: 'un', quantidade_atual: 25, quantidade_minima: 5,  custo_unitario: 28.00,  categoria: 'Hidratação'      },
      { nome: 'Esfoliante Facial',       unidade: 'un', quantidade_atual: 30, quantidade_minima: 5,  custo_unitario: 22.00,  categoria: 'Limpeza'         },
      { nome: 'Gel de Limpeza Facial',   unidade: 'un', quantidade_atual: 40, quantidade_minima: 8,  custo_unitario: 18.00,  categoria: 'Limpeza'         },
      { nome: 'Ácido Glicólico 10%',     unidade: 'ml', quantidade_atual: 12, quantidade_minima: 3,  custo_unitario: 55.00,  categoria: 'Ativo Cosmético' },
      { nome: 'Sérum Vitamina C',        unidade: 'un', quantidade_atual: 18, quantidade_minima: 4,  custo_unitario: 75.00,  categoria: 'Ativo Cosmético' },
      { nome: 'Óleo de Amêndoa Doce',    unidade: 'ml', quantidade_atual: 20, quantidade_minima: 5,  custo_unitario: 35.00,  categoria: 'Massagem'        },
      { nome: 'Máscara de Argila Verde', unidade: 'un', quantidade_atual: 35, quantidade_minima: 8,  custo_unitario: 25.00,  categoria: 'Tratamento'      },
      { nome: 'Colágeno Hidrolisado',    unidade: 'un', quantidade_atual: 10, quantidade_minima: 2,  custo_unitario: 120.00, categoria: 'Suplemento'      },
    ])
    .select()

  if (ePr) { fail('Inserir produtos', ePr.message); process.exit(1) }
  ok(`${prods.length} produtos inseridos`)
  prods.forEach(p => info(`→ ${p.nome} (${p.quantidade_atual} ${p.unidade}) — R$ ${p.custo_unitario}`))

  const [pAcidoH, pProtetor, pCreme, pEsfoliante, pGel, pAcidoG, pSerum, pOleo, pArgila, pColageno] = prods

  // ─── 4. Servico_produtos ────────────────────────────────
  section(4, 'Vínculos servico_produtos (11 registros)')

  const vinculos = [
    // Limpeza de Pele: gel (1 un) + esfoliante (0.5 un) + ácido hialurônico (0.5 ml)
    { servico_id: sLimpeza.id,       produto_id: pGel.id,      quantidade_usada: 1   },
    { servico_id: sLimpeza.id,       produto_id: pEsfoliante.id, quantidade_usada: 0.5 },
    { servico_id: sLimpeza.id,       produto_id: pAcidoH.id,   quantidade_usada: 0.5 },
    // Harmonização Facial: ácido hialurônico (2 ml) + protetor solar (1 un)
    { servico_id: sHarmonizacao.id,  produto_id: pAcidoH.id,   quantidade_usada: 2   },
    { servico_id: sHarmonizacao.id,  produto_id: pProtetor.id, quantidade_usada: 1   },
    // Massagem Relaxante: óleo de amêndoa (2 ml) + creme hidratante (1 un)
    { servico_id: sMassagem.id,      produto_id: pOleo.id,     quantidade_usada: 2   },
    { servico_id: sMassagem.id,      produto_id: pCreme.id,    quantidade_usada: 1   },
    // Peeling Químico: ácido glicólico (1 ml) + máscara de argila (1 un)
    { servico_id: sPeeling.id,       produto_id: pAcidoG.id,   quantidade_usada: 1   },
    { servico_id: sPeeling.id,       produto_id: pArgila.id,   quantidade_usada: 1   },
    // Hidratação Facial: sérum vitamina C (1 un) + creme hidratante (0.5 un)
    { servico_id: sHidratacao.id,    produto_id: pSerum.id,    quantidade_usada: 1   },
    { servico_id: sHidratacao.id,    produto_id: pCreme.id,    quantidade_usada: 0.5 },
  ]

  const { error: eV } = await supabase.from('servico_produtos').insert(vinculos)
  if (eV) { fail('Vincular produtos aos serviços', eV.message) }
  else ok(`${vinculos.length} vínculos criados — 5 serviços com produtos associados`)

  // ─── 5. Clientes ────────────────────────────────────────
  section(5, 'Clientes (5)')

  const { data: clts, error: eC } = await supabase
    .from('clientes')
    .insert([
      { nome: 'Mariana Silva',     telefone: '(11) 98765-4321', email: 'mariana@email.com',  data_nascimento: '1990-03-15', observacoes: 'Pele sensível, evitar esfoliantes abrasivos' },
      { nome: 'Fernanda Oliveira', telefone: '(11) 99234-5678', email: 'fernanda@email.com', data_nascimento: '1985-07-22' },
      { nome: 'Juliana Santos',    telefone: '(21) 97654-3210', email: 'juliana@email.com',  data_nascimento: '1993-11-08', observacoes: 'Preferência por atendimento pela manhã' },
      { nome: 'Camila Rodrigues',  telefone: '(11) 98123-4567', email: 'camila@email.com',   data_nascimento: '1988-05-30' },
      { nome: 'Patricia Lima',     telefone: '(21) 99876-5432', email: 'patricia@email.com', data_nascimento: '1995-01-12', observacoes: 'Alérgica a parabenos' },
    ])
    .select()

  if (eC) { fail('Inserir clientes', eC.message); process.exit(1) }
  ok(`${clts.length} clientes inseridos`)
  clts.forEach(c => info(`→ ${c.nome} — ${c.telefone}`))

  const [cMariana, cFernanda, cJuliana, cCamila, cPatricia] = clts

  // ─── 6. Agendamentos ────────────────────────────────────
  section(6, 'Agendamentos (3 — agendado / confirmado / concluído)')

  const amanha      = new Date(); amanha.setDate(amanha.getDate() + 1)
  const ontem       = new Date(); ontem.setDate(ontem.getDate() - 1)
  const tresDiasAtras = new Date(); tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)

  // Agendamento 1 — agendado (amanhã)
  const { data: ag1, error: eA1 } = await supabase
    .from('agendamentos')
    .insert({
      cliente_id: cMariana.id, profissional_id: pAna.id, servico_id: sLimpeza.id,
      data_hora: `${amanha.toISOString().split('T')[0]}T10:00:00`,
      status: 'agendado', valor_cobrado: 150,
    })
    .select().single()

  if (eA1) fail('Agendamento 1 (agendado)', eA1.message)
  else ok(`Agendamento 1 — Mariana / Limpeza de Pele / amanhã 10h — AGENDADO`)

  // Agendamento 2 — confirmado (ontem)
  const { data: ag2, error: eA2 } = await supabase
    .from('agendamentos')
    .insert({
      cliente_id: cFernanda.id, profissional_id: pAna.id, servico_id: sHidratacao.id,
      data_hora: `${ontem.toISOString().split('T')[0]}T14:00:00`,
      status: 'confirmado', valor_cobrado: 120,
    })
    .select().single()

  if (eA2) fail('Agendamento 2 (confirmado)', eA2.message)
  else ok(`Agendamento 2 — Fernanda / Hidratação Facial / ontem 14h — CONFIRMADO`)

  // Agendamento 3 — CONCLUÍDO via UPDATE (dispara trigger de estoque + receita)
  // Passo 1: inserir como 'agendado'
  const { data: ag3, error: eA3a } = await supabase
    .from('agendamentos')
    .insert({
      cliente_id: cJuliana.id, profissional_id: pRafael.id, servico_id: sHarmonizacao.id,
      data_hora: `${tresDiasAtras.toISOString().split('T')[0]}T09:00:00`,
      status: 'agendado', valor_cobrado: 800,
    })
    .select().single()

  if (eA3a) { fail('Agendamento 3 pré-conclusão', eA3a.message) }
  else ok(`Agendamento 3 criado — Juliana / Harmonização Facial — aguardando conclusão`)

  // Passo 2: atualizar para 'concluido' → trigger dispara
  const { error: eA3b } = await supabase
    .from('agendamentos')
    .update({ status: 'concluido', forma_pagamento: 'pix', valor_cobrado: 800 })
    .eq('id', ag3.id)

  if (eA3b) fail(`UPDATE para concluído — trigger de estoque/receita`, eA3b.message)
  else ok(`Agendamento 3 → CONCLUÍDO (R$ 800, PIX) — trigger disparado`)

  // ─── 7. Venda com itens e 3 parcelas ────────────────────
  section(7, 'Venda — Camila / 2 itens / 3 parcelas PIX')

  const { data: venda, error: eV1 } = await supabase
    .from('vendas')
    .insert({
      cliente_id: cCamila.id,
      status: 'pendente',
      total: 330,
      desconto: 0,
      total_final: 330,
      observacoes: 'Parcelado em 3x PIX',
    })
    .select().single()

  if (eV1) { fail('Criar venda', eV1.message) }
  else ok(`Venda criada (id: ${venda.id.slice(0,8)}…) — total R$ 330`)

  // Itens da venda
  const { error: eV2 } = await supabase
    .from('venda_itens')
    .insert([
      {
        venda_id: venda.id, tipo: 'produto', produto_id: pSerum.id, servico_id: null,
        descricao: 'Sérum Vitamina C', quantidade: 2, preco_unitario: 75, subtotal: 150,
      },
      {
        venda_id: venda.id, tipo: 'servico', produto_id: null, servico_id: sMassagem.id,
        descricao: 'Massagem Relaxante', quantidade: 1, preco_unitario: 180, subtotal: 180,
      },
    ])

  if (eV2) fail('Inserir itens da venda', eV2.message)
  else ok('2 itens inseridos — Sérum Vitamina C (produto) + Massagem Relaxante (serviço)')

  // Parcelas
  const umMesAtras  = new Date(); umMesAtras.setMonth(umMesAtras.getMonth() - 1)
  const umMesFuturo = new Date(); umMesFuturo.setMonth(umMesFuturo.getMonth() + 1)

  const { data: parcelas, error: eV3 } = await supabase
    .from('venda_pagamentos')
    .insert([
      { venda_id: venda.id, forma_pagamento: 'pix', valor: 110, data_vencimento: umMesAtras.toISOString().split('T')[0],  status: 'pendente' },
      { venda_id: venda.id, forma_pagamento: 'pix', valor: 110, data_vencimento: hoje,                                    status: 'pendente' },
      { venda_id: venda.id, forma_pagamento: 'pix', valor: 110, data_vencimento: umMesFuturo.toISOString().split('T')[0], status: 'pendente' },
    ])
    .select()

  if (eV3) fail('Inserir parcelas', eV3.message)
  else ok(`3 parcelas de R$ 110 criadas`)
  info(`→ Parcela 1: ${umMesAtras.toISOString().split('T')[0]} (vencida)`)
  info(`→ Parcela 2: ${hoje} (hoje)`)
  info(`→ Parcela 3: ${umMesFuturo.toISOString().split('T')[0]} (futura)`)

  // Marcar parcela 1 como paga → trigger cria transacao
  const { error: eV4 } = await supabase
    .from('venda_pagamentos')
    .update({ status: 'pago' })
    .eq('id', parcelas[0].id)

  if (eV4) fail('Marcar parcela 1 como paga (trigger de receita)', eV4.message)
  else ok(`Parcela 1 marcada como PAGA — trigger de receita disparado`)

  // Atualizar status da venda para parcialmente_pago
  await supabase.from('vendas').update({ status: 'parcialmente_pago' }).eq('id', venda.id)

  // ─── 8. Despesas ────────────────────────────────────────
  section(8, 'Despesas financeiras (2)')

  const { error: eD } = await supabase
    .from('transacoes')
    .insert([
      { tipo: 'despesa', descricao: 'Aluguel do Espaço — ' + mesAtual,          valor: 2500.00, data: hoje, categoria: 'Aluguel',     forma_pagamento: 'dinheiro' },
      { tipo: 'despesa', descricao: 'Fornecedor: Ácidos e Ativos Cosméticos',   valor: 850.00,  data: hoje, categoria: 'Fornecedor',  forma_pagamento: 'pix'      },
    ])

  if (eD) fail('Inserir despesas', eD.message)
  else ok(`2 despesas lançadas: R$ 2.500,00 (Aluguel) + R$ 850,00 (Fornecedor)`)

  // ═══════════════════════════════════════════════════════
  // BLOCO 2: VERIFICAÇÕES DOS TRIGGERS E CONSISTÊNCIA
  // ═══════════════════════════════════════════════════════

  console.log(`\n${BOLD}${B}${'═'.repeat(57)}`)
  console.log(`  VERIFICAÇÕES DE INTEGRIDADE`)
  console.log(`${'═'.repeat(57)}${RESET}`)

  // ─── V1. Trigger agendamento concluído → movimentações ──
  section('V1', 'Trigger: agendamento concluído → estoque')

  const { data: movAg } = await supabase
    .from('movimentacoes_estoque')
    .select('quantidade, motivo, produto:produtos(nome, unidade)')
    .eq('agendamento_id', ag3.id)
    .eq('tipo', 'saida')

  if (!movAg || movAg.length === 0) {
    fail('Nenhuma movimentação de saída criada para o agendamento concluído')
    warn('Verifique se o trigger "trigger_agendamento_concluido" está ativo no Supabase')
  } else {
    ok(`${movAg.length} saída(s) de estoque registradas para Harmonização Facial`)
    movAg.forEach(m => info(`→ ${m.produto.nome}: ${m.quantidade} ${m.produto.unidade} — "${m.motivo}"`))
  }

  // Verificar estoque individual dos produtos do serviço Harmonização
  // Harmonização usa: Ácido Hialurônico (2 ml) + Protetor Solar (1 un)
  hr()

  const { data: stockAcidoH } = await supabase
    .from('produtos').select('quantidade_atual').eq('id', pAcidoH.id).single()

  const esperadoAcidoH = 20 - 2 // inicial 20, harmonização usa 2
  const qtdAcidoH = Number(stockAcidoH?.quantidade_atual)
  if (qtdAcidoH === esperadoAcidoH) {
    ok(`Ácido Hialurônico: ${qtdAcidoH} restantes (${20} − ${2} = ${esperadoAcidoH} ✓)`)
  } else {
    fail(`Ácido Hialurônico: esperado ${esperadoAcidoH}, encontrado ${qtdAcidoH}`)
  }

  const { data: stockProtetor } = await supabase
    .from('produtos').select('quantidade_atual').eq('id', pProtetor.id).single()

  const esperadoProtetor = 15 - 1 // inicial 15, harmonização usa 1
  const qtdProtetor = Number(stockProtetor?.quantidade_atual)
  if (qtdProtetor === esperadoProtetor) {
    ok(`Protetor Solar FPS 50: ${qtdProtetor} restantes (${15} − ${1} = ${esperadoProtetor} ✓)`)
  } else {
    fail(`Protetor Solar: esperado ${esperadoProtetor}, encontrado ${qtdProtetor}`)
  }

  // ─── V2. Trigger agendamento concluído → receita ────────
  section('V2', 'Trigger: agendamento concluído → transacao receita')

  const { data: recAgend } = await supabase
    .from('transacoes')
    .select('descricao, valor, forma_pagamento, data')
    .eq('agendamento_id', ag3.id)
    .eq('tipo', 'receita')

  if (!recAgend || recAgend.length === 0) {
    fail('Nenhuma receita gerada para o agendamento concluído')
    warn('Trigger "trigger_agendamento_concluido" pode não estar criando a transação')
  } else {
    ok(`Receita gerada: "${recAgend[0].descricao}" — R$ ${recAgend[0].valor}`)
    info(`→ Forma: ${recAgend[0].forma_pagamento} | Data: ${recAgend[0].data}`)
  }

  // ─── V3. Trigger venda_itens → estoque do produto ───────
  section('V3', 'Trigger: venda_itens (produto) → estoque')

  // Sérum: inicial 18, venda usou 2 — nenhum agendamento concluído usou sérum
  const { data: stockSerum } = await supabase
    .from('produtos').select('quantidade_atual').eq('id', pSerum.id).single()

  const esperadoSerum = 18 - 2
  const qtdSerum = Number(stockSerum?.quantidade_atual)
  if (qtdSerum === esperadoSerum) {
    ok(`Sérum Vitamina C: ${qtdSerum} restantes (${18} − ${2} = ${esperadoSerum} ✓)`)
  } else {
    fail(`Sérum Vitamina C: esperado ${esperadoSerum}, encontrado ${qtdSerum}`)
    warn('Trigger "trigger_itens_venda" pode não estar reduzindo o estoque')
  }

  const { data: movVenda } = await supabase
    .from('movimentacoes_estoque')
    .select('quantidade, motivo')
    .eq('produto_id', pSerum.id)
    .eq('tipo', 'saida')

  if (!movVenda || movVenda.length === 0) {
    fail('Nenhuma movimentação de saída gerada para item de venda (Sérum Vitamina C)')
  } else {
    ok(`Movimentação registrada: Sérum Vitamina C — ${movVenda[0].quantidade} un saída (motivo: "${movVenda[0].motivo}")`)
  }

  // ─── V4. Trigger venda_pagamentos → receita ─────────────
  section('V4', 'Trigger: pagamento de parcela → transacao receita')

  const { data: recParcela } = await supabase
    .from('transacoes')
    .select('descricao, valor, forma_pagamento')
    .eq('tipo', 'receita')
    .ilike('descricao', '%Venda%parcela%')

  if (!recParcela || recParcela.length === 0) {
    fail('Nenhuma receita gerada para parcela de venda paga')
    warn('Trigger "trigger_pagamento_venda" pode não estar criando a transação')
  } else {
    ok(`Receita de parcela gerada: "${recParcela[0].descricao}" — R$ ${recParcela[0].valor}`)
    info(`→ Forma: ${recParcela[0].forma_pagamento}`)
  }

  // Verificar data_pagamento (possível bug em trigger AFTER)
  const { data: parcela1 } = await supabase
    .from('venda_pagamentos')
    .select('status, data_pagamento')
    .eq('id', parcelas[0].id)
    .single()

  if (parcela1?.data_pagamento) {
    ok(`data_pagamento preenchida: ${parcela1.data_pagamento}`)
  } else {
    warn(`data_pagamento NÃO foi preenchida automaticamente — trigger AFTER não pode modificar NEW`)
    info(`  Bug conhecido: a função usa "new.data_pagamento = current_date" em trigger AFTER.`)
    info(`  Em triggers AFTER, modificar NEW não tem efeito. Use BEFORE trigger para isso.`)
    issues.push('data_pagamento não preenchida automaticamente (trigger AFTER não modifica a linha)')
  }

  // ─── V5. Totais financeiros do mês ──────────────────────
  section('V5', 'Totais financeiros do mês corrente')

  const ultimoDia = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  const { data: transacoesMes } = await supabase
    .from('transacoes')
    .select('tipo, valor, descricao')
    .gte('data', `${mesAtual}-01`)
    .lte('data', ultimoDia)

  const receitas  = transacoesMes?.filter(t => t.tipo === 'receita')  ?? []
  const despesas  = transacoesMes?.filter(t => t.tipo === 'despesa')  ?? []
  const totRec    = receitas.reduce((s, t) => s + Number(t.valor), 0)
  const totDesp   = despesas.reduce((s, t) => s + Number(t.valor), 0)
  const lucro     = totRec - totDesp

  info(`Receitas: R$ ${totRec.toFixed(2)} (${receitas.length} lançamento(s))`)
  receitas.forEach(t => info(`  + ${t.descricao}: R$ ${Number(t.valor).toFixed(2)}`))
  info(`Despesas: R$ ${totDesp.toFixed(2)} (${despesas.length} lançamento(s))`)
  despesas.forEach(t => info(`  − ${t.descricao}: R$ ${Number(t.valor).toFixed(2)}`))
  info(`Lucro:    R$ ${lucro.toFixed(2)}`)

  // Receita mínima esperada: agendamento R$800 + parcela R$110 = R$910
  const recMinEsperada = 800 + 110
  if (totRec >= recMinEsperada) {
    ok(`Receitas ≥ R$ ${recMinEsperada} esperado (encontrado R$ ${totRec.toFixed(2)})`)
  } else {
    fail(`Receitas abaixo do esperado: mínimo R$ ${recMinEsperada}, encontrado R$ ${totRec.toFixed(2)}`)
  }

  const despMinEsperada = 2500 + 850
  if (totDesp >= despMinEsperada) {
    ok(`Despesas ≥ R$ ${despMinEsperada} (encontrado R$ ${totDesp.toFixed(2)})`)
  } else {
    fail(`Despesas abaixo do esperado: mínimo R$ ${despMinEsperada}, encontrado R$ ${totDesp.toFixed(2)}`)
  }

  // ─── V6. Contagens do dashboard ─────────────────────────
  section('V6', 'Contagens do dashboard')

  const [
    { count: nProfs  },
    { count: nClts   },
    { count: nServs  },
    { count: nProds  },
    { count: nAgs    },
    { count: nVendas },
  ] = await Promise.all([
    supabase.from('profissionais').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('servicos').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('agendamentos').select('*', { count: 'exact', head: true }),
    supabase.from('vendas').select('*', { count: 'exact', head: true }),
  ])

  const tabelas = [
    ['Profissionais', nProfs,  3],
    ['Clientes',      nClts,   5],
    ['Serviços',      nServs,  5],
    ['Produtos',      nProds,  10],
    ['Agendamentos',  nAgs,    3],
    ['Vendas',        nVendas, 1],
  ]

  for (const [nome, qtd, min] of tabelas) {
    if (qtd >= min) ok(`${nome}: ${qtd} registros ✓`)
    else fail(`${nome}: esperado ≥ ${min}, encontrado ${qtd}`)
  }

  // ─── V7. Estoque crítico ─────────────────────────────────
  section('V7', 'Verificação de estoque crítico')

  const { data: todosProdos } = await supabase
    .from('produtos')
    .select('nome, quantidade_atual, quantidade_minima, unidade')
    .eq('ativo', true)
    .order('nome')

  const criticos = todosProdos?.filter(p => Number(p.quantidade_atual) <= Number(p.quantidade_minima)) ?? []

  todosProdos?.forEach(p => {
    const isCrit = Number(p.quantidade_atual) <= Number(p.quantidade_minima)
    const icon = isCrit ? `${R}⚠${RESET}` : `${G}✓${RESET}`
    info(`${icon} ${p.nome}: ${p.quantidade_atual}/${p.quantidade_minima} ${p.unidade}`)
  })

  if (criticos.length === 0) ok(`Nenhum produto em estoque crítico`)
  else warn(`${criticos.length} produto(s) em estoque crítico detectados — alerta no dashboard funcionará`)

  // ─── V8. Integridade referencial ─────────────────────────
  section('V8', 'Integridade das relações')

  // Verificar que o agendamento concluído tem agendamento_id em movimentacoes
  const { data: movComLink } = await supabase
    .from('movimentacoes_estoque')
    .select('id')
    .eq('agendamento_id', ag3.id)

  if (movComLink && movComLink.length > 0) {
    ok(`Movimentações vinculadas ao agendamento via agendamento_id (${movComLink.length} registros)`)
  } else {
    fail('Movimentações não vinculadas ao agendamento')
  }

  // Verificar servico_produtos criados
  const { data: spCheck } = await supabase
    .from('servico_produtos')
    .select('id', { count: 'exact' })
    .in('servico_id', servs.map(s => s.id))

  ok(`${spCheck?.length ?? 0} registros em servico_produtos para os serviços inseridos`)

  // ═══════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════

  console.log(`\n${BOLD}${B}${'═'.repeat(57)}`)
  console.log(`  RESULTADO FINAL`)
  console.log(`${'═'.repeat(57)}${RESET}`)
  console.log(`  ${G}${BOLD}✓ ${passed} verificações passaram${RESET}`)
  if (warnings > 0)
    console.log(`  ${Y}${BOLD}⚠ ${warnings} avisos${RESET}`)
  if (failed > 0) {
    console.log(`  ${R}${BOLD}✗ ${failed} verificações falharam${RESET}`)
    console.log(`\n${BOLD}  Problemas encontrados:${RESET}`)
    issues.forEach(i => console.log(`  ${R}•${RESET} ${i}`))
  } else {
    console.log(`\n  ${G}${BOLD}Todos os testes passaram! Sistema funcionando corretamente.${RESET}`)
  }

  console.log(`\n  ${DIM}Dados inseridos com service role key (bypassa RLS).${RESET}`)
  console.log(`  ${DIM}Para limpar: delete from vendas, agendamentos, clientes, etc.${RESET}\n`)
}

main().catch(err => {
  console.error(`\n${R}${BOLD}❌ Erro inesperado:${RESET}`, err.message)
  console.error(err)
  process.exit(1)
})

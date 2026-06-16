export type Produto = {
  id: string
  nome: string
  descricao: string | null
  unidade: string
  quantidade_atual: number
  quantidade_minima: number
  custo_unitario: number
  categoria: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export type MovimentacaoEstoque = {
  id: string
  produto_id: string
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  custo_unitario: number | null
  motivo: string | null
  agendamento_id: string | null
  created_at: string
  produto?: Produto
}

export type Cliente = {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  data_nascimento: string | null
  observacoes: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export type Profissional = {
  id: string
  nome: string
  especialidade: string | null
  telefone: string | null
  email: string | null
  ativo: boolean
  created_at: string
}

export type Agendamento = {
  id: string
  cliente_id: string
  profissional_id: string
  servico_id: string | null
  servico_realizado: string | null
  data_hora: string
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado'
  valor_cobrado: number
  forma_pagamento: 'dinheiro' | 'pix' | 'credito' | 'debito' | null
  observacoes: string | null
  created_at: string
  updated_at: string
  cliente?: Cliente
  profissional?: Profissional
  servico?: { nome: string }
}

export type VendaItem = {
  id: string
  venda_id: string
  tipo: 'produto' | 'servico'
  produto_id: string | null
  servico_id: string | null
  descricao: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

export type VendaPagamento = {
  id: string
  venda_id: string
  forma_pagamento: 'dinheiro' | 'pix' | 'credito' | 'debito'
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: 'pendente' | 'pago' | 'cancelado'
  created_at: string
}

export type Venda = {
  id: string
  cliente_id: string
  status: 'pendente' | 'pago' | 'parcialmente_pago' | 'cancelado'
  total: number
  desconto: number
  total_final: number
  observacoes: string | null
  created_at: string
  updated_at: string
  cliente?: { nome: string }
  venda_itens?: VendaItem[]
  venda_pagamentos?: VendaPagamento[]
}

export type Transacao = {
  id: string
  tipo: 'receita' | 'despesa'
  descricao: string
  valor: number
  data: string
  categoria: string | null
  forma_pagamento: string | null
  agendamento_id: string | null
  created_at: string
}

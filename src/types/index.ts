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

export type Servico = {
  id: string
  nome: string
  descricao: string | null
  duracao_minutos: number
  preco: number
  ativo: boolean
  created_at: string
}

export type ServicoItem = {
  id: string
  servico_id: string
  produto_id: string
  quantidade_usada: number
  produto?: Produto
  servico?: Servico
}

export type Agendamento = {
  id: string
  cliente_id: string
  profissional_id: string
  servico_id: string
  data_hora: string
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado'
  valor_cobrado: number
  forma_pagamento: 'dinheiro' | 'pix' | 'credito' | 'debito' | null
  observacoes: string | null
  created_at: string
  updated_at: string
  cliente?: Cliente
  profissional?: Profissional
  servico?: Servico
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

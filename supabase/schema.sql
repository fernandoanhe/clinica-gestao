-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- TABELA: produtos
create table produtos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  unidade text not null default 'un',
  quantidade_atual numeric(10,2) not null default 0,
  quantidade_minima numeric(10,2) not null default 0,
  custo_unitario numeric(10,2) not null default 0,
  categoria text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quantidade_atual_positiva check (quantidade_atual >= 0)
);

-- TABELA: clientes
create table clientes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  telefone text,
  email text,
  data_nascimento date,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TABELA: profissionais
create table profissionais (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  especialidade text,
  telefone text,
  email text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- TABELA: servicos
create table servicos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  duracao_minutos integer not null default 60,
  preco numeric(10,2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- TABELA: servico_produtos (quais produtos cada serviço consome)
create table servico_produtos (
  id uuid primary key default uuid_generate_v4(),
  servico_id uuid not null references servicos(id) on delete cascade,
  produto_id uuid not null references produtos(id) on delete cascade,
  quantidade_usada numeric(10,2) not null default 1,
  unique(servico_id, produto_id)
);

-- TABELA: agendamentos
create table agendamentos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid not null references clientes(id),
  profissional_id uuid not null references profissionais(id),
  servico_id uuid not null references servicos(id),
  data_hora timestamptz not null,
  status text not null default 'agendado'
    check (status in ('agendado', 'confirmado', 'concluido', 'cancelado')),
  valor_cobrado numeric(10,2) not null default 0,
  forma_pagamento text check (forma_pagamento in ('dinheiro', 'pix', 'credito', 'debito')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TABELA: movimentacoes_estoque
create table movimentacoes_estoque (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid not null references produtos(id),
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste')),
  quantidade numeric(10,2) not null,
  custo_unitario numeric(10,2),
  motivo text,
  agendamento_id uuid references agendamentos(id),
  created_at timestamptz not null default now()
);

-- TABELA: transacoes financeiras
create table transacoes (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null check (tipo in ('receita', 'despesa')),
  descricao text not null,
  valor numeric(10,2) not null,
  data date not null default current_date,
  categoria text,
  forma_pagamento text,
  agendamento_id uuid references agendamentos(id),
  created_at timestamptz not null default now()
);

-- FUNÇÃO: atualizar updated_at automaticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_produtos_updated_at
  before update on produtos
  for each row execute function update_updated_at_column();

create trigger update_clientes_updated_at
  before update on clientes
  for each row execute function update_updated_at_column();

create trigger update_agendamentos_updated_at
  before update on agendamentos
  for each row execute function update_updated_at_column();

-- FUNÇÃO: ao concluir agendamento, baixar estoque e registrar receita automaticamente
create or replace function processar_agendamento_concluido()
returns trigger as $$
declare
  item record;
begin
  if new.status = 'concluido' and old.status != 'concluido' then

    for item in
      select sp.produto_id, sp.quantidade_usada
      from servico_produtos sp
      where sp.servico_id = new.servico_id
    loop
      insert into movimentacoes_estoque (produto_id, tipo, quantidade, motivo, agendamento_id)
      values (item.produto_id, 'saida', item.quantidade_usada, 'Atendimento concluído', new.id);

      update produtos
      set quantidade_atual = quantidade_atual - item.quantidade_usada
      where id = item.produto_id;
    end loop;

    insert into transacoes (tipo, descricao, valor, data, categoria, forma_pagamento, agendamento_id)
    values (
      'receita',
      'Atendimento - ' || (select s.nome from servicos s where s.id = new.servico_id),
      new.valor_cobrado,
      current_date,
      'Atendimento',
      new.forma_pagamento,
      new.id
    );

  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_agendamento_concluido
  after update on agendamentos
  for each row execute function processar_agendamento_concluido();

-- RLS: habilitar em todas as tabelas
alter table produtos enable row level security;
alter table clientes enable row level security;
alter table profissionais enable row level security;
alter table servicos enable row level security;
alter table servico_produtos enable row level security;
alter table agendamentos enable row level security;
alter table movimentacoes_estoque enable row level security;
alter table transacoes enable row level security;

-- Políticas: usuários autenticados têm acesso total
create policy "Acesso autenticado - produtos" on produtos for all to authenticated using (true) with check (true);
create policy "Acesso autenticado - clientes" on clientes for all to authenticated using (true) with check (true);
create policy "Acesso autenticado - profissionais" on profissionais for all to authenticated using (true) with check (true);
create policy "Acesso autenticado - servicos" on servicos for all to authenticated using (true) with check (true);
create policy "Acesso autenticado - servico_produtos" on servico_produtos for all to authenticated using (true) with check (true);
create policy "Acesso autenticado - agendamentos" on agendamentos for all to authenticated using (true) with check (true);
create policy "Acesso autenticado - movimentacoes" on movimentacoes_estoque for all to authenticated using (true) with check (true);
create policy "Acesso autenticado - transacoes" on transacoes for all to authenticated using (true) with check (true);

-- Índices para performance
create index idx_agendamentos_data_hora on agendamentos(data_hora);
create index idx_agendamentos_status on agendamentos(status);
create index idx_agendamentos_cliente on agendamentos(cliente_id);
create index idx_movimentacoes_produto on movimentacoes_estoque(produto_id);
create index idx_transacoes_data on transacoes(data);
create index idx_transacoes_tipo on transacoes(tipo);

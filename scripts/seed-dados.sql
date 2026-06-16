-- ============================================================
-- SEED DE DADOS — Clínica Gestão
-- Cole este script no SQL Editor do Supabase e execute.
-- https://supabase.com/dashboard → SQL Editor → New query
-- ============================================================

DO $$
DECLARE
  -- Profissionais
  p_ana     uuid;
  p_rafael  uuid;
  p_carlos  uuid;

  -- Serviços
  s_limpeza        uuid;
  s_harmonizacao   uuid;
  s_massagem       uuid;
  s_peeling        uuid;
  s_hidratacao     uuid;

  -- Produtos
  pr_acido_h   uuid;
  pr_protetor  uuid;
  pr_creme     uuid;
  pr_esfol     uuid;
  pr_gel       uuid;
  pr_acido_g   uuid;
  pr_serum     uuid;
  pr_oleo      uuid;
  pr_argila    uuid;
  pr_colageno  uuid;

  -- Clientes
  c_mariana   uuid;
  c_fernanda  uuid;
  c_juliana   uuid;
  c_camila    uuid;
  c_patricia  uuid;

  -- Agendamentos
  ag3_id      uuid;

  -- Venda
  v_id        uuid;
  pg1_id      uuid;

  -- Datas
  d_amanha         date := current_date + 1;
  d_ontem          date := current_date - 1;
  d_3dias_atras    date := current_date - 3;
  d_1mes_atras     date := current_date - interval '1 month';
  d_1mes_futuro    date := current_date + interval '1 month';

BEGIN

  RAISE NOTICE '=== [1/8] Inserindo Profissionais ===';

  INSERT INTO profissionais (nome, especialidade, telefone, email)
    VALUES ('Ana Luiza Costa', 'Esteticista', '(11) 98711-1111', 'ana@clinicateste.com')
    RETURNING id INTO p_ana;

  INSERT INTO profissionais (nome, especialidade, telefone, email)
    VALUES ('Dr. Rafael Mendes', 'Dermatologista', '(11) 98722-2222', 'rafael@clinicateste.com')
    RETURNING id INTO p_rafael;

  INSERT INTO profissionais (nome, especialidade, telefone, email)
    VALUES ('Carlos Eduardo', 'Massoterapeuta', '(11) 98733-3333', 'carlos@clinicateste.com')
    RETURNING id INTO p_carlos;

  RAISE NOTICE '✓ 3 profissionais inseridos';

  -- ─────────────────────────────────────────────────────────
  RAISE NOTICE '=== [2/8] Inserindo Serviços ===';

  INSERT INTO servicos (nome, descricao, duracao_minutos, preco)
    VALUES ('Limpeza de Pele Profunda', 'Limpeza completa com extração e hidratação', 60, 150.00)
    RETURNING id INTO s_limpeza;

  INSERT INTO servicos (nome, descricao, duracao_minutos, preco)
    VALUES ('Harmonização Facial', 'Preenchimento com ácido hialurônico e bioestimulador', 120, 800.00)
    RETURNING id INTO s_harmonizacao;

  INSERT INTO servicos (nome, descricao, duracao_minutos, preco)
    VALUES ('Massagem Relaxante', 'Massagem corporal completa com óleos essenciais', 60, 180.00)
    RETURNING id INTO s_massagem;

  INSERT INTO servicos (nome, descricao, duracao_minutos, preco)
    VALUES ('Peeling Químico', 'Renovação celular profunda com ácidos', 90, 350.00)
    RETURNING id INTO s_peeling;

  INSERT INTO servicos (nome, descricao, duracao_minutos, preco)
    VALUES ('Hidratação Facial Intensiva', 'Hidratação com vitamina C e ácido hialurônico', 45, 120.00)
    RETURNING id INTO s_hidratacao;

  RAISE NOTICE '✓ 5 serviços inseridos';

  -- ─────────────────────────────────────────────────────────
  RAISE NOTICE '=== [3/8] Inserindo Produtos ===';

  INSERT INTO produtos (nome, unidade, quantidade_atual, quantidade_minima, custo_unitario, categoria)
    VALUES ('Ácido Hialurônico 1%', 'ml', 20, 5, 45.00, 'Ativo Cosmético')
    RETURNING id INTO pr_acido_h;

  INSERT INTO produtos (nome, unidade, quantidade_atual, quantidade_minima, custo_unitario, categoria)
    VALUES ('Protetor Solar FPS 50', 'un', 15, 3, 38.00, 'Proteção Solar')
    RETURNING id INTO pr_protetor;

  INSERT INTO produtos (nome, unidade, quantidade_atual, quantidade_minima, custo_unitario, categoria)
    VALUES ('Creme Hidratante Corporal', 'un', 25, 5, 28.00, 'Hidratação')
    RETURNING id INTO pr_creme;

  INSERT INTO produtos (nome, unidade, quantidade_atual, quantidade_minima, custo_unitario, categoria)
    VALUES ('Esfoliante Facial', 'un', 30, 5, 22.00, 'Limpeza')
    RETURNING id INTO pr_esfol;

  INSERT INTO produtos (nome, unidade, quantidade_atual, quantidade_minima, custo_unitario, categoria)
    VALUES ('Gel de Limpeza Facial', 'un', 40, 8, 18.00, 'Limpeza')
    RETURNING id INTO pr_gel;

  INSERT INTO produtos (nome, unidade, quantidade_atual, quantidade_minima, custo_unitario, categoria)
    VALUES ('Ácido Glicólico 10%', 'ml', 12, 3, 55.00, 'Ativo Cosmético')
    RETURNING id INTO pr_acido_g;

  INSERT INTO produtos (nome, unidade, quantidade_atual, quantidade_minima, custo_unitario, categoria)
    VALUES ('Sérum Vitamina C', 'un', 18, 4, 75.00, 'Ativo Cosmético')
    RETURNING id INTO pr_serum;

  INSERT INTO produtos (nome, unidade, quantidade_atual, quantidade_minima, custo_unitario, categoria)
    VALUES ('Óleo de Amêndoa Doce', 'ml', 20, 5, 35.00, 'Massagem')
    RETURNING id INTO pr_oleo;

  INSERT INTO produtos (nome, unidade, quantidade_atual, quantidade_minima, custo_unitario, categoria)
    VALUES ('Máscara de Argila Verde', 'un', 35, 8, 25.00, 'Tratamento')
    RETURNING id INTO pr_argila;

  INSERT INTO produtos (nome, unidade, quantidade_atual, quantidade_minima, custo_unitario, categoria)
    VALUES ('Colágeno Hidrolisado', 'un', 10, 2, 120.00, 'Suplemento')
    RETURNING id INTO pr_colageno;

  RAISE NOTICE '✓ 10 produtos inseridos';

  -- ─────────────────────────────────────────────────────────
  RAISE NOTICE '=== [4/8] Vinculando produtos aos serviços ===';

  INSERT INTO servico_produtos (servico_id, produto_id, quantidade_usada) VALUES
    -- Limpeza de Pele: gel (1 un) + esfoliante (0.5) + ácido hialurônico (0.5 ml)
    (s_limpeza,      pr_gel,      1.0),
    (s_limpeza,      pr_esfol,    0.5),
    (s_limpeza,      pr_acido_h,  0.5),
    -- Harmonização Facial: ácido hialurônico (2 ml) + protetor solar (1 un)
    (s_harmonizacao, pr_acido_h,  2.0),
    (s_harmonizacao, pr_protetor, 1.0),
    -- Massagem Relaxante: óleo de amêndoa (2 ml) + creme hidratante (1 un)
    (s_massagem,     pr_oleo,     2.0),
    (s_massagem,     pr_creme,    1.0),
    -- Peeling Químico: ácido glicólico (1 ml) + máscara de argila (1 un)
    (s_peeling,      pr_acido_g,  1.0),
    (s_peeling,      pr_argila,   1.0),
    -- Hidratação Facial: sérum vitamina C (1 un) + creme hidratante (0.5 un)
    (s_hidratacao,   pr_serum,    1.0),
    (s_hidratacao,   pr_creme,    0.5);

  RAISE NOTICE '✓ 11 vínculos servico_produtos criados';

  -- ─────────────────────────────────────────────────────────
  RAISE NOTICE '=== [5/8] Inserindo Clientes ===';

  INSERT INTO clientes (nome, telefone, email, data_nascimento, observacoes)
    VALUES ('Mariana Silva', '(11) 98765-4321', 'mariana@email.com', '1990-03-15', 'Pele sensível, evitar esfoliantes abrasivos')
    RETURNING id INTO c_mariana;

  INSERT INTO clientes (nome, telefone, email, data_nascimento)
    VALUES ('Fernanda Oliveira', '(11) 99234-5678', 'fernanda@email.com', '1985-07-22')
    RETURNING id INTO c_fernanda;

  INSERT INTO clientes (nome, telefone, email, data_nascimento, observacoes)
    VALUES ('Juliana Santos', '(21) 97654-3210', 'juliana@email.com', '1993-11-08', 'Preferência por atendimento pela manhã')
    RETURNING id INTO c_juliana;

  INSERT INTO clientes (nome, telefone, email, data_nascimento)
    VALUES ('Camila Rodrigues', '(11) 98123-4567', 'camila@email.com', '1988-05-30')
    RETURNING id INTO c_camila;

  INSERT INTO clientes (nome, telefone, email, data_nascimento, observacoes)
    VALUES ('Patricia Lima', '(21) 99876-5432', 'patricia@email.com', '1995-01-12', 'Alérgica a parabenos')
    RETURNING id INTO c_patricia;

  RAISE NOTICE '✓ 5 clientes inseridos';

  -- ─────────────────────────────────────────────────────────
  RAISE NOTICE '=== [6/8] Inserindo Agendamentos ===';

  -- Agendamento 1: AGENDADO (amanhã)
  INSERT INTO agendamentos (cliente_id, profissional_id, servico_id, data_hora, status, valor_cobrado)
    VALUES (c_mariana, p_ana, s_limpeza, d_amanha || 'T10:00:00+00', 'agendado', 150.00);

  -- Agendamento 2: CONFIRMADO (ontem)
  INSERT INTO agendamentos (cliente_id, profissional_id, servico_id, data_hora, status, valor_cobrado)
    VALUES (c_fernanda, p_ana, s_hidratacao, d_ontem || 'T14:00:00+00', 'confirmado', 120.00);

  -- Agendamento 3: inserir como 'agendado' primeiro...
  INSERT INTO agendamentos (cliente_id, profissional_id, servico_id, data_hora, status, valor_cobrado)
    VALUES (c_juliana, p_rafael, s_harmonizacao, d_3dias_atras || 'T09:00:00+00', 'agendado', 800.00)
    RETURNING id INTO ag3_id;

  -- ...depois atualizar para CONCLUÍDO → trigger dispara: baixa estoque + gera receita
  UPDATE agendamentos
    SET status = 'concluido', forma_pagamento = 'pix', valor_cobrado = 800.00
    WHERE id = ag3_id;

  RAISE NOTICE '✓ 3 agendamentos criados (agendado + confirmado + concluído)';
  RAISE NOTICE '  → Trigger disparado: estoque baixado e receita registrada para Harmonização Facial';

  -- ─────────────────────────────────────────────────────────
  RAISE NOTICE '=== [7/8] Criando Venda com 2 itens e 3 parcelas ===';

  INSERT INTO vendas (cliente_id, status, total, desconto, total_final, observacoes)
    VALUES (c_camila, 'pendente', 330.00, 0.00, 330.00, 'Parcelado em 3x PIX')
    RETURNING id INTO v_id;

  -- Item 1: produto (trigger vai baixar estoque do Sérum Vitamina C)
  INSERT INTO venda_itens (venda_id, tipo, produto_id, servico_id, descricao, quantidade, preco_unitario, subtotal)
    VALUES (v_id, 'produto', pr_serum, NULL, 'Sérum Vitamina C', 2, 75.00, 150.00);

  -- Item 2: serviço (sem baixa de estoque via trigger de venda_itens)
  INSERT INTO venda_itens (venda_id, tipo, produto_id, servico_id, descricao, quantidade, preco_unitario, subtotal)
    VALUES (v_id, 'servico', NULL, s_massagem, 'Massagem Relaxante', 1, 180.00, 180.00);

  RAISE NOTICE '  → Trigger disparado: 2 Sérum Vitamina C baixados do estoque';

  -- Parcelas
  INSERT INTO venda_pagamentos (venda_id, forma_pagamento, valor, data_vencimento, status)
    VALUES (v_id, 'pix', 110.00, d_1mes_atras, 'pendente')
    RETURNING id INTO pg1_id;

  INSERT INTO venda_pagamentos (venda_id, forma_pagamento, valor, data_vencimento, status)
    VALUES (v_id, 'pix', 110.00, current_date, 'pendente');

  INSERT INTO venda_pagamentos (venda_id, forma_pagamento, valor, data_vencimento, status)
    VALUES (v_id, 'pix', 110.00, d_1mes_futuro, 'pendente');

  -- Marcar parcela 1 como PAGA → trigger gera receita em transacoes
  UPDATE venda_pagamentos
    SET status = 'pago'
    WHERE id = pg1_id;

  -- Atualizar status da venda
  UPDATE vendas SET status = 'parcialmente_pago' WHERE id = v_id;

  RAISE NOTICE '✓ Venda criada: 2 itens, 3 parcelas (1ª paga)';
  RAISE NOTICE '  → Trigger disparado: receita de R$ 110 registrada em transações';

  -- ─────────────────────────────────────────────────────────
  RAISE NOTICE '=== [8/8] Lançando Despesas ===';

  INSERT INTO transacoes (tipo, descricao, valor, data, categoria, forma_pagamento)
    VALUES
      ('despesa', 'Aluguel do Espaço — ' || to_char(current_date, 'MM/YYYY'), 2500.00, current_date, 'Aluguel',    'dinheiro'),
      ('despesa', 'Fornecedor: Ácidos e Ativos Cosméticos',                    850.00,  current_date, 'Fornecedor', 'pix');

  RAISE NOTICE '✓ 2 despesas lançadas (R$ 2.500 + R$ 850)';

  -- ═══════════════════════════════════════════════════════
  -- VERIFICAÇÕES AUTOMÁTICAS
  -- ═══════════════════════════════════════════════════════

  RAISE NOTICE '';
  RAISE NOTICE '════════ VERIFICAÇÕES DE INTEGRIDADE ════════';

  -- V1: Movimentações geradas pelo agendamento concluído
  DECLARE
    cnt_mov_ag integer;
  BEGIN
    SELECT count(*) INTO cnt_mov_ag
      FROM movimentacoes_estoque
      WHERE agendamento_id = ag3_id AND tipo = 'saida';

    IF cnt_mov_ag > 0 THEN
      RAISE NOTICE '✓ [V1] % movimentação(ões) de saída geradas para agendamento concluído', cnt_mov_ag;
    ELSE
      RAISE WARNING '✗ [V1] Nenhuma movimentação de saída para agendamento concluído!';
    END IF;
  END;

  -- V2: Estoque do Ácido Hialurônico (era 20, harmonização usa 2 → esperado 18)
  DECLARE
    qtd_acido numeric;
  BEGIN
    SELECT quantidade_atual INTO qtd_acido FROM produtos WHERE id = pr_acido_h;
    IF qtd_acido = 18 THEN
      RAISE NOTICE '✓ [V2] Ácido Hialurônico: % ml restantes (20 − 2 = 18)', qtd_acido;
    ELSE
      RAISE WARNING '✗ [V2] Ácido Hialurônico: esperado 18, encontrado %', qtd_acido;
    END IF;
  END;

  -- V3: Estoque do Protetor Solar (era 15, harmonização usa 1 → esperado 14)
  DECLARE
    qtd_prot numeric;
  BEGIN
    SELECT quantidade_atual INTO qtd_prot FROM produtos WHERE id = pr_protetor;
    IF qtd_prot = 14 THEN
      RAISE NOTICE '✓ [V3] Protetor Solar FPS 50: % un restantes (15 − 1 = 14)', qtd_prot;
    ELSE
      RAISE WARNING '✗ [V3] Protetor Solar: esperado 14, encontrado %', qtd_prot;
    END IF;
  END;

  -- V4: Receita gerada pelo agendamento concluído
  DECLARE
    cnt_rec_ag integer;
    val_rec_ag numeric;
  BEGIN
    SELECT count(*), sum(valor) INTO cnt_rec_ag, val_rec_ag
      FROM transacoes
      WHERE agendamento_id = ag3_id AND tipo = 'receita';

    IF cnt_rec_ag > 0 THEN
      RAISE NOTICE '✓ [V4] Receita de agendamento registrada: R$ %', val_rec_ag;
    ELSE
      RAISE WARNING '✗ [V4] Nenhuma receita gerada para agendamento concluído!';
    END IF;
  END;

  -- V5: Estoque do Sérum Vitamina C (era 18, venda usou 2 → esperado 16)
  DECLARE
    qtd_serum numeric;
  BEGIN
    SELECT quantidade_atual INTO qtd_serum FROM produtos WHERE id = pr_serum;
    IF qtd_serum = 16 THEN
      RAISE NOTICE '✓ [V5] Sérum Vitamina C: % un restantes (18 − 2 = 16)', qtd_serum;
    ELSE
      RAISE WARNING '✗ [V5] Sérum Vitamina C: esperado 16, encontrado %', qtd_serum;
    END IF;
  END;

  -- V6: Receita gerada pela parcela paga
  DECLARE
    cnt_rec_parc integer;
  BEGIN
    SELECT count(*) INTO cnt_rec_parc
      FROM transacoes
      WHERE tipo = 'receita' AND descricao ILIKE '%Venda%parcela%';

    IF cnt_rec_parc > 0 THEN
      RAISE NOTICE '✓ [V6] Receita de parcela de venda registrada (%x)', cnt_rec_parc;
    ELSE
      RAISE WARNING '✗ [V6] Nenhuma receita gerada pela parcela paga!';
    END IF;
  END;

  -- V7: Totais financeiros do mês
  DECLARE
    tot_rec  numeric;
    tot_desp numeric;
  BEGIN
    SELECT
      coalesce(sum(case when tipo='receita' then valor end), 0),
      coalesce(sum(case when tipo='despesa' then valor end), 0)
    INTO tot_rec, tot_desp
    FROM transacoes
    WHERE date_trunc('month', data) = date_trunc('month', current_date);

    RAISE NOTICE '─── Financeiro do mês ───────────────────';
    RAISE NOTICE '  Receitas:  R$ %', tot_rec;
    RAISE NOTICE '  Despesas:  R$ %', tot_desp;
    RAISE NOTICE '  Lucro:     R$ %', (tot_rec - tot_desp);

    IF tot_rec >= 910 THEN
      RAISE NOTICE '✓ [V7] Receitas ≥ R$ 910,00 (agendamento R$800 + parcela R$110)';
    ELSE
      RAISE WARNING '✗ [V7] Receitas abaixo do esperado: %', tot_rec;
    END IF;

    IF tot_desp >= 3350 THEN
      RAISE NOTICE '✓ [V8] Despesas = R$ % (aluguel R$2.500 + fornecedor R$850)', tot_desp;
    ELSE
      RAISE WARNING '✗ [V8] Despesas abaixo do esperado: %', tot_desp;
    END IF;
  END;

  -- V9: Bug conhecido — data_pagamento no trigger AFTER
  DECLARE
    dp date;
  BEGIN
    SELECT data_pagamento INTO dp FROM venda_pagamentos WHERE id = pg1_id;
    IF dp IS NOT NULL THEN
      RAISE NOTICE '✓ [V9] data_pagamento preenchida: %', dp;
    ELSE
      RAISE WARNING '⚠ [V9] data_pagamento NÃO preenchida — trigger AFTER não pode modificar NEW.';
      RAISE WARNING '   Correção: mudar trigger_pagamento_venda para BEFORE UPDATE.';
    END IF;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '════════ SEED CONCLUÍDO COM SUCESSO ════════';
  RAISE NOTICE 'Acesse o sistema em https://clinica-gestao-iota.vercel.app';

END $$;


-- ═══════════════════════════════════════════════════════════════
-- CONSULTA DE VERIFICAÇÃO — rode separadamente se desejar
-- ═══════════════════════════════════════════════════════════════

/*
-- Ver estoque atual dos produtos inseridos no teste:
SELECT nome, quantidade_atual, quantidade_minima,
       CASE WHEN quantidade_atual <= quantidade_minima THEN 'CRÍTICO' ELSE 'OK' END as status
FROM produtos
WHERE nome IN ('Ácido Hialurônico 1%','Protetor Solar FPS 50','Sérum Vitamina C')
ORDER BY nome;

-- Ver movimentações geradas pelos triggers:
SELECT m.tipo, m.quantidade, m.motivo, p.nome as produto, m.created_at
FROM movimentacoes_estoque m
JOIN produtos p ON p.id = m.produto_id
ORDER BY m.created_at DESC
LIMIT 10;

-- Ver transações do mês:
SELECT tipo, descricao, valor, forma_pagamento, data
FROM transacoes
WHERE date_trunc('month', data) = date_trunc('month', current_date)
ORDER BY tipo, data;

-- Ver parcelas da venda:
SELECT forma_pagamento, valor, data_vencimento, status, data_pagamento
FROM venda_pagamentos
ORDER BY data_vencimento;
*/

-- ============================================================
-- MIGRAÇÃO: remover módulo de Serviços cadastrados
--
-- Contexto: o sistema foi refatorado para usar texto livre nos
-- agendamentos/vendas em vez de serviços cadastrados em tabela.
--
-- COMO APLICAR:
-- Supabase Dashboard → SQL Editor → New query → Cole e execute.
-- ============================================================

-- ── 1. Adicionar coluna servico_realizado em agendamentos ─────────────────────
ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS servico_realizado text;

-- ── 2. Tornar servico_id opcional (era NOT NULL) ──────────────────────────────
ALTER TABLE agendamentos
  ALTER COLUMN servico_id DROP NOT NULL;

-- ── 3. Atualizar trigger para usar servico_realizado ──────────────────────────
--
-- Mudanças:
--   a) Remover loop de baixa de estoque via servico_produtos
--      (agora o front-end faz isso manualmente no modal de conclusão)
--   b) Usar COALESCE(servico_realizado, servico.nome, 'Serviço realizado')
--      na descrição da receita em transacoes (compatível com dados antigos)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION processar_agendamento_concluido()
RETURNS TRIGGER AS $$
DECLARE
  v_descricao text;
BEGIN
  IF NEW.status = 'concluido' AND OLD.status != 'concluido' THEN

    -- Montar descrição compatível com registros antigos (servico_id) e novos (texto livre)
    SELECT COALESCE(
      NEW.servico_realizado,
      (SELECT s.nome FROM servicos s WHERE s.id = NEW.servico_id),
      'Serviço realizado'
    ) INTO v_descricao;

    INSERT INTO transacoes (tipo, descricao, valor, data, categoria, forma_pagamento, agendamento_id)
    VALUES (
      'receita',
      'Atendimento - ' || v_descricao,
      NEW.valor_cobrado,
      current_date,
      'Atendimento',
      NEW.forma_pagamento,
      NEW.id
    );

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 4. Verificação ───────────────────────────────────────────────────────────
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'agendamentos'
  AND column_name IN ('servico_id', 'servico_realizado')
ORDER BY column_name;
-- Esperado:
--   servico_id       | YES
--   servico_realizado| YES

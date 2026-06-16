-- ============================================================
-- CORREÇÃO: trigger_pagamento_venda  (bug AFTER → BEFORE)
--
-- BUG: O trigger estava definido como AFTER UPDATE, mas a função
-- processar_pagamento_venda usa "new.data_pagamento = current_date".
-- Em triggers AFTER, modificar NEW não tem efeito — a linha já foi
-- gravada. O campo data_pagamento fica NULL mesmo após o update.
--
-- CORREÇÃO: mudar de AFTER UPDATE para BEFORE UPDATE, o que permite
-- interceptar e modificar o registro antes de ser persistido.
--
-- COMO APLICAR:
-- 1. Abra o Supabase Dashboard → SQL Editor → New query
-- 2. Cole este arquivo inteiro e clique em "Run"
-- ============================================================

-- ── 1. Garantir que a função existe (recria com BEFORE em mente) ──────────────
CREATE OR REPLACE FUNCTION processar_pagamento_venda()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma parcela é marcada como paga:
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN

    -- Preencher data_pagamento (funciona em BEFORE triggers)
    NEW.data_pagamento = current_date;

    -- Registrar receita em transacoes
    INSERT INTO transacoes (tipo, descricao, valor, data, categoria, forma_pagamento)
    VALUES (
      'receita',
      'Venda - parcela ' || NEW.forma_pagamento,
      NEW.valor,
      current_date,
      'Venda',
      NEW.forma_pagamento
    );

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 2. Remover trigger com timing errado ─────────────────────────────────────
DROP TRIGGER IF EXISTS trigger_pagamento_venda ON venda_pagamentos;

-- ── 3. Recriar como BEFORE UPDATE ────────────────────────────────────────────
CREATE TRIGGER trigger_pagamento_venda
  BEFORE UPDATE ON venda_pagamentos
  FOR EACH ROW EXECUTE FUNCTION processar_pagamento_venda();

-- ── 4. Verificação ───────────────────────────────────────────────────────────
SELECT
  tgname AS trigger,
  CASE (tgtype & 2)::bool WHEN true THEN 'BEFORE' ELSE 'AFTER' END AS timing,
  CASE (tgtype & 28)::int
    WHEN 4  THEN 'INSERT'
    WHEN 8  THEN 'DELETE'
    WHEN 16 THEN 'UPDATE'
    ELSE 'OTHER'
  END AS evento
FROM pg_trigger
WHERE tgname = 'trigger_pagamento_venda';
-- Resultado esperado: timing = BEFORE, evento = UPDATE

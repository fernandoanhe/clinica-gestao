-- ============================================================
-- CORREÇÃO: trigger_pagamento_venda
--
-- BUG: O trigger está definido como AFTER UPDATE, mas a função
-- usa "new.data_pagamento = current_date". Em triggers AFTER,
-- modificar NEW não tem efeito — a linha já foi gravada.
-- CORREÇÃO: mudar de AFTER para BEFORE.
-- ============================================================

-- 1. Remover trigger atual
DROP TRIGGER IF EXISTS trigger_pagamento_venda ON venda_pagamentos;

-- 2. Recriar como BEFORE UPDATE (permite modificar NEW antes de gravar)
CREATE TRIGGER trigger_pagamento_venda
  BEFORE UPDATE ON venda_pagamentos
  FOR EACH ROW EXECUTE FUNCTION processar_pagamento_venda();

-- Verificação
SELECT tgname, tgtype::text,
  CASE (tgtype & 2)::bool WHEN true THEN 'BEFORE' ELSE 'AFTER' END as timing
FROM pg_trigger
WHERE tgname = 'trigger_pagamento_venda';

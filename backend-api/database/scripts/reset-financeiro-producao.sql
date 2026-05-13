-- =============================================================================
-- Reset dos DADOS FINANCEIROS para go-live em produção
-- =============================================================================
-- Remove lançamentos operacionais (contas, NF, boletos, vendas/compras,
-- movimentações, receitas/custos, aluguéis financeiros, etc.) e zera saldos
-- nas contas bancárias cadastradas — mantém o cadastro das contas em si.
--
-- NÃO remove: clientes, obras, funcionários, orçamentos, medições, produtos,
-- nem o catálogo `itens_custos_mensais` / `tipos_impostos` (apenas dados
-- transacionais).
--
-- ATENÇÃO:
--   • Irreversível sem backup.
--   • Faça backup completo (pg_dump ou backup Supabase) antes de executar.
--   • Rode no SQL Editor do Supabase como role com permissão nas tabelas.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Triggers de saldo em movimentações (evita recálculo durante TRUNCATE)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.movimentacoes_bancarias') IS NOT NULL THEN
    BEGIN
      ALTER TABLE movimentacoes_bancarias DISABLE TRIGGER trigger_atualizar_saldo_movimentacao_delete;
      ALTER TABLE movimentacoes_bancarias DISABLE TRIGGER trigger_atualizar_saldo_movimentacao_update;
      ALTER TABLE movimentacoes_bancarias DISABLE TRIGGER trigger_atualizar_saldo_movimentacao;
      RAISE NOTICE 'Triggers de saldo em movimentacoes_bancarias: DESABILITADOS';
    EXCEPTION
      WHEN undefined_object THEN
        RAISE NOTICE 'Algum trigger de movimentacoes_bancarias nao existe; seguindo mesmo assim';
    END;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) TRUNCATE das tabelas financeiras (ordem: filhas antes das pais quando
--    necessário; RESTART IDENTITY reinicia IDs; CASCADE inclui dependentes)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tabela TEXT;
  -- Ordem respeitando FKs típicas do projeto (aluguel: filhas -> alugueis_residencias)
  tabelas_financeiras TEXT[] := ARRAY[
    'vendas_itens',
    'vendas',
    'compras_itens',
    'compras',
    'cobrancas_aluguel',
    'aluguel_contas_recorrentes',
    'arquivos_alugueis',
    'notas_fiscais_itens',
    'impostos_pagamentos',
    'boletos',
    'notas_fiscais',
    'impostos_financeiros',
    'impostos',
    'notas_debito',
    'contas_receber',
    'contas_pagar',
    'movimentacoes_bancarias',
    'transferencias_bancarias',
    'receitas',
    'custos',
    'custos_mensais',
    'alugueis_residencias'
  ];
BEGIN
  FOREACH tabela IN ARRAY tabelas_financeiras LOOP
    IF to_regclass('public.' || tabela) IS NOT NULL THEN
      EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', tabela);
      RAISE NOTICE '%: TRUNCATE OK', tabela;
    ELSE
      RAISE NOTICE '%: tabela nao existe, ignorando', tabela;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Zerar saldos (mantém linhas em contas_bancarias)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tem_saldo_inicial BOOLEAN;
BEGIN
  IF to_regclass('public.contas_bancarias') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'contas_bancarias'
        AND column_name = 'saldo_inicial'
    ) INTO tem_saldo_inicial;

    IF tem_saldo_inicial THEN
      UPDATE contas_bancarias
      SET saldo_atual = 0,
          saldo_inicial = 0,
          updated_at = CURRENT_TIMESTAMP;
    ELSE
      UPDATE contas_bancarias
      SET saldo_atual = 0,
          updated_at = CURRENT_TIMESTAMP;
    END IF;

    RAISE NOTICE 'contas_bancarias: saldos zerados (cadastro preservado)';
  ELSE
    RAISE NOTICE 'contas_bancarias: tabela nao existe';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Reabilitar triggers de movimentações
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.movimentacoes_bancarias') IS NOT NULL THEN
    BEGIN
      ALTER TABLE movimentacoes_bancarias ENABLE TRIGGER trigger_atualizar_saldo_movimentacao_delete;
      ALTER TABLE movimentacoes_bancarias ENABLE TRIGGER trigger_atualizar_saldo_movimentacao_update;
      ALTER TABLE movimentacoes_bancarias ENABLE TRIGGER trigger_atualizar_saldo_movimentacao;
      RAISE NOTICE 'Triggers de saldo em movimentacoes_bancarias: REABILITADOS';
    EXCEPTION
      WHEN undefined_object THEN
        RAISE NOTICE 'Algum trigger de movimentacoes_bancarias nao existe';
    END;
  END IF;
END $$;

COMMIT;

-- -----------------------------------------------------------------------------
-- Opcional: também zerar o catálogo de itens de custo mensal (descomente se
-- quiser remover até os itens padronizados 01.01, 01.02, ... e recarregar via
-- migration / seed depois).
-- -----------------------------------------------------------------------------
-- BEGIN;
-- TRUNCATE TABLE itens_custos_mensais RESTART IDENTITY CASCADE;
-- COMMIT;

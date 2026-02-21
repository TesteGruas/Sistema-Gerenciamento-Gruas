-- Migration: Reset completo dos dados financeiros
-- Data: 2026-02-20
-- Descrição: Remove todos os dados financeiros (notas fiscais, impostos, boletos,
--            movimentações bancárias, cobranças, vendas, compras) e zera os saldos
--            das contas bancárias.
-- ATENÇÃO: Esta operação é IRREVERSÍVEL. Execute apenas após backup.

BEGIN;

-- ============================================================
-- 1. Desabilitar triggers de movimentações bancárias
--    (evita recálculo de saldo durante a exclusão em massa)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'movimentacoes_bancarias') THEN
        ALTER TABLE movimentacoes_bancarias DISABLE TRIGGER trigger_atualizar_saldo_movimentacao_delete;
        ALTER TABLE movimentacoes_bancarias DISABLE TRIGGER trigger_atualizar_saldo_movimentacao_update;
        ALTER TABLE movimentacoes_bancarias DISABLE TRIGGER trigger_atualizar_saldo_movimentacao;
    END IF;
END $$;

-- ============================================================
-- 2. Limpar tabelas filhas primeiro (respeitar foreign keys)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cobrancas_aluguel') THEN
        DELETE FROM cobrancas_aluguel;
        RAISE NOTICE 'cobrancas_aluguel: dados removidos';
    ELSE
        RAISE NOTICE 'cobrancas_aluguel: tabela não existe, pulando';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'impostos_pagamentos') THEN
        DELETE FROM impostos_pagamentos;
        RAISE NOTICE 'impostos_pagamentos: dados removidos';
    ELSE
        RAISE NOTICE 'impostos_pagamentos: tabela não existe, pulando';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas_fiscais_itens') THEN
        DELETE FROM notas_fiscais_itens;
        RAISE NOTICE 'notas_fiscais_itens: dados removidos';
    ELSE
        RAISE NOTICE 'notas_fiscais_itens: tabela não existe, pulando';
    END IF;
END $$;

-- ============================================================
-- 3. Limpar tabelas intermediárias
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'boletos') THEN
        DELETE FROM boletos;
        RAISE NOTICE 'boletos: dados removidos';
    ELSE
        RAISE NOTICE 'boletos: tabela não existe, pulando';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'impostos_financeiros') THEN
        DELETE FROM impostos_financeiros;
        RAISE NOTICE 'impostos_financeiros: dados removidos';
    ELSE
        RAISE NOTICE 'impostos_financeiros: tabela não existe, pulando';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas_fiscais') THEN
        DELETE FROM notas_fiscais;
        RAISE NOTICE 'notas_fiscais: dados removidos';
    ELSE
        RAISE NOTICE 'notas_fiscais: tabela não existe, pulando';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'movimentacoes_bancarias') THEN
        DELETE FROM movimentacoes_bancarias;
        RAISE NOTICE 'movimentacoes_bancarias: dados removidos';
    ELSE
        RAISE NOTICE 'movimentacoes_bancarias: tabela não existe, pulando';
    END IF;
END $$;

-- ============================================================
-- 4. Limpar vendas e compras
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendas') THEN
        DELETE FROM vendas;
        RAISE NOTICE 'vendas: dados removidos';
    ELSE
        RAISE NOTICE 'vendas: tabela não existe, pulando';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compras') THEN
        DELETE FROM compras;
        RAISE NOTICE 'compras: tabela não existe, pulando';
    ELSE
        RAISE NOTICE 'compras: tabela não existe, pulando';
    END IF;
END $$;

-- ============================================================
-- 5. Zerar saldos das contas bancárias
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contas_bancarias') THEN
        UPDATE contas_bancarias
        SET saldo_atual = 0,
            updated_at = CURRENT_TIMESTAMP;
        RAISE NOTICE 'contas_bancarias: saldos zerados';
    ELSE
        RAISE NOTICE 'contas_bancarias: tabela não existe, pulando';
    END IF;
END $$;

-- ============================================================
-- 6. Reabilitar triggers de movimentações bancárias
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'movimentacoes_bancarias') THEN
        ALTER TABLE movimentacoes_bancarias ENABLE TRIGGER trigger_atualizar_saldo_movimentacao_delete;
        ALTER TABLE movimentacoes_bancarias ENABLE TRIGGER trigger_atualizar_saldo_movimentacao_update;
        ALTER TABLE movimentacoes_bancarias ENABLE TRIGGER trigger_atualizar_saldo_movimentacao;
    END IF;
END $$;

COMMIT;

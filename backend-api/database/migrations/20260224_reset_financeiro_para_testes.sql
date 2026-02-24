-- Migration: Reset financeiro para ambiente de testes
-- Data: 2026-02-24
-- Descricao: Remove dados financeiros operacionais e zera saldos bancarios
-- ATENCAO: Operacao irreversivel. Use apenas em ambiente de teste.

BEGIN;

-- Limpeza de tabelas financeiras (com reinicio de IDs e cascade de FKs)
DO $$
DECLARE
    tabela TEXT;
    tabelas_financeiras TEXT[] := ARRAY[
        'cobrancas_aluguel',
        'impostos_pagamentos',
        'notas_fiscais_itens',
        'boletos',
        'impostos_financeiros',
        'impostos',
        'contas_receber',
        'contas_pagar',
        'movimentacoes_bancarias',
        'notas_fiscais'
    ];
BEGIN
    FOREACH tabela IN ARRAY tabelas_financeiras LOOP
        IF to_regclass('public.' || tabela) IS NOT NULL THEN
            EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', tabela);
            RAISE NOTICE '%: dados removidos (TRUNCATE + RESTART IDENTITY)', tabela;
        ELSE
            RAISE NOTICE '%: tabela nao existe, pulando', tabela;
        END IF;
    END LOOP;
END $$;

-- Zerar saldos das contas bancarias para iniciar testes do zero
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

        RAISE NOTICE 'contas_bancarias: saldo_atual e saldo_inicial zerados';
    ELSE
        RAISE NOTICE 'contas_bancarias: tabela nao existe, pulando';
    END IF;
END $$;

COMMIT;


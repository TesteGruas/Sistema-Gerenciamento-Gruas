-- =========================================================
-- Migration: Adicionar tipo 'adicional' para responsáveis técnicos
-- Data: 2026-02-03
-- Objetivo: Atualizar documentação para incluir o novo tipo 'adicional' de responsáveis técnicos dinâmicos
-- =========================================================

-- Iniciar transação
BEGIN;

-- Atualizar comentário da coluna tipo para incluir o novo tipo 'adicional'
COMMENT ON COLUMN responsaveis_tecnicos.tipo IS 'Tipo do responsável técnico: obra (cliente), irbana_equipamentos, irbana_manutencoes, irbana_montagem_operacao, adicional (responsáveis técnicos adicionais dinâmicos)';

-- Finalizar transação
COMMIT;

-- =========================================================
-- Resumo da Migration
-- =========================================================
-- ✅ Comentário da coluna tipo atualizado para incluir 'adicional'
-- ✅ Não há necessidade de alterar estrutura da tabela (campo já aceita valores dinâmicos)
-- ✅ Backend já validado para aceitar tipo 'adicional'
-- =========================================================

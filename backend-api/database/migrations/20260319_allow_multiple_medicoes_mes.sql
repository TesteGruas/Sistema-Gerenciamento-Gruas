-- Migration: Permitir múltiplas medições no mesmo mês
-- Data: 2026-03-19
-- Descrição: Remove regras de unicidade por período para permitir mais de uma
-- medição mensal para o mesmo orçamento, obra ou grua.

-- Remover constraint antiga de unicidade (caso ainda exista)
ALTER TABLE medicoes_mensais
  DROP CONSTRAINT IF EXISTS medicoes_mensais_orcamento_id_periodo_key;

-- Remover índices únicos por período (criados em migrations anteriores)
DROP INDEX IF EXISTS medicoes_mensais_orcamento_periodo_unique;
DROP INDEX IF EXISTS medicoes_mensais_obra_periodo_unique;
DROP INDEX IF EXISTS medicoes_mensais_grua_periodo_unique;

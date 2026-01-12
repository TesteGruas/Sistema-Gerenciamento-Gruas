-- Migration: Adicionar campo orcamento_id na tabela obras
-- Data: 2025-01-06
-- Descrição: Adiciona campo para vincular obra ao orçamento aprovado

-- Adicionar coluna orcamento_id na tabela obras
ALTER TABLE obras
ADD COLUMN IF NOT EXISTS orcamento_id INTEGER REFERENCES orcamentos(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_obras_orcamento_id ON obras(orcamento_id);

-- Comentário na coluna
COMMENT ON COLUMN obras.orcamento_id IS 'ID do orçamento aprovado vinculado à obra. Obra deve ter um orçamento aprovado antes de ser criada.';


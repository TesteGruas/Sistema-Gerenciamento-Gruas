-- Migration: Adicionar campo cno_arquivo na tabela obras
-- Data: 2025-01-27
-- Descrição: Adiciona campo para armazenar o caminho do arquivo do CNO

-- Adicionar coluna cno_arquivo na tabela obras
ALTER TABLE obras
ADD COLUMN IF NOT EXISTS cno_arquivo VARCHAR(500);

-- Comentário na coluna
COMMENT ON COLUMN obras.cno_arquivo IS 'Caminho do arquivo PDF do CNO (Cadastro Nacional de Obras)';

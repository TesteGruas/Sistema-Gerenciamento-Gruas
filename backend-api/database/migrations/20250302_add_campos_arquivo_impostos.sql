-- Migration: Adicionar campos de arquivo na tabela impostos
-- Data: 2025-03-02
-- Descrição: Adiciona campos para armazenar arquivos anexados aos impostos (comprovantes, boletos, etc.)

-- Adicionar colunas de arquivo na tabela impostos
ALTER TABLE impostos
ADD COLUMN IF NOT EXISTS arquivo_anexo VARCHAR(500),
ADD COLUMN IF NOT EXISTS nome_arquivo VARCHAR(255);

-- Comentários nas colunas
COMMENT ON COLUMN impostos.arquivo_anexo IS 'URL ou caminho do arquivo anexado ao imposto';
COMMENT ON COLUMN impostos.nome_arquivo IS 'Nome original do arquivo anexado';


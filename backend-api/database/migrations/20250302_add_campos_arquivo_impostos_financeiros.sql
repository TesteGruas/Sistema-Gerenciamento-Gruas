-- Migration: Adicionar campos de arquivo na tabela impostos_financeiros
-- Data: 2025-03-02
-- Descrição: Adiciona campos para armazenar o arquivo anexado a um imposto financeiro (ex: comprovante de pagamento)

ALTER TABLE impostos_financeiros
ADD COLUMN IF NOT EXISTS arquivo_anexo VARCHAR(500),
ADD COLUMN IF NOT EXISTS nome_arquivo VARCHAR(255);

COMMENT ON COLUMN impostos_financeiros.arquivo_anexo IS 'URL ou caminho do arquivo anexado ao imposto';
COMMENT ON COLUMN impostos_financeiros.nome_arquivo IS 'Nome original do arquivo anexado ao imposto';













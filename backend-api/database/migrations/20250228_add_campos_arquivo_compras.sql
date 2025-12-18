-- Migration: Adicionar campos de arquivo na tabela compras
-- Data: 2025-02-28
-- Descrição: Adiciona campos para armazenar arquivos anexados às compras (boletos, notas fiscais, etc.)

-- Adicionar colunas de arquivo na tabela compras
ALTER TABLE compras
ADD COLUMN IF NOT EXISTS arquivo_compra VARCHAR(500),
ADD COLUMN IF NOT EXISTS nome_arquivo VARCHAR(255),
ADD COLUMN IF NOT EXISTS tamanho_arquivo BIGINT,
ADD COLUMN IF NOT EXISTS tipo_arquivo VARCHAR(50);

-- Comentários nas colunas
COMMENT ON COLUMN compras.arquivo_compra IS 'URL ou caminho do arquivo anexado à compra';
COMMENT ON COLUMN compras.nome_arquivo IS 'Nome original do arquivo';
COMMENT ON COLUMN compras.tamanho_arquivo IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN compras.tipo_arquivo IS 'Tipo do arquivo: pdf, imagem, documento, planilha, xml';


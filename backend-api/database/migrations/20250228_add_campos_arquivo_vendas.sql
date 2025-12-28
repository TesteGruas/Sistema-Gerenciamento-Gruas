-- Migration: Adicionar campos de arquivo na tabela vendas
-- Data: 2025-02-28
-- Descrição: Adiciona campos para armazenar arquivos anexados às vendas (boletos, notas fiscais, contratos, etc.)

-- Adicionar colunas de arquivo na tabela vendas
ALTER TABLE vendas
ADD COLUMN IF NOT EXISTS arquivo_venda VARCHAR(500),
ADD COLUMN IF NOT EXISTS nome_arquivo VARCHAR(255),
ADD COLUMN IF NOT EXISTS tamanho_arquivo BIGINT,
ADD COLUMN IF NOT EXISTS tipo_arquivo VARCHAR(50);

-- Comentários nas colunas
COMMENT ON COLUMN vendas.arquivo_venda IS 'URL ou caminho do arquivo anexado à venda';
COMMENT ON COLUMN vendas.nome_arquivo IS 'Nome original do arquivo';
COMMENT ON COLUMN vendas.tamanho_arquivo IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN vendas.tipo_arquivo IS 'Tipo do arquivo: pdf, imagem, documento, planilha, xml';







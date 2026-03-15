-- Migration: Endereco detalhado da obra
-- Descricao: Adiciona campos estruturados de endereco na tabela obras

ALTER TABLE obras
ADD COLUMN IF NOT EXISTS endereco_rua TEXT,
ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR(30),
ADD COLUMN IF NOT EXISTS endereco_bairro TEXT,
ADD COLUMN IF NOT EXISTS endereco_complemento TEXT;

COMMENT ON COLUMN obras.endereco_rua IS 'Logradouro da obra';
COMMENT ON COLUMN obras.endereco_numero IS 'Numero da obra';
COMMENT ON COLUMN obras.endereco_bairro IS 'Bairro da obra';
COMMENT ON COLUMN obras.endereco_complemento IS 'Complemento do endereco da obra';

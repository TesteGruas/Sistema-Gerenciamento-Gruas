-- Migration: Estruturar endereço completo da obra em clientes
-- Data: 2026-02-28
-- Descrição: Adiciona campos de complemento, cidade, estado e CEP para endereço da obra

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS endereco_obra_complemento TEXT,
ADD COLUMN IF NOT EXISTS cidade_obra VARCHAR(150),
ADD COLUMN IF NOT EXISTS estado_obra VARCHAR(2),
ADD COLUMN IF NOT EXISTS cep_obra VARCHAR(9);

COMMENT ON COLUMN clientes.endereco_obra IS 'Logradouro/endereço principal da obra vinculada ao cliente';
COMMENT ON COLUMN clientes.endereco_obra_complemento IS 'Complemento do endereço da obra vinculada ao cliente';
COMMENT ON COLUMN clientes.cidade_obra IS 'Cidade da obra vinculada ao cliente';
COMMENT ON COLUMN clientes.estado_obra IS 'UF da obra vinculada ao cliente';
COMMENT ON COLUMN clientes.cep_obra IS 'CEP da obra vinculada ao cliente';

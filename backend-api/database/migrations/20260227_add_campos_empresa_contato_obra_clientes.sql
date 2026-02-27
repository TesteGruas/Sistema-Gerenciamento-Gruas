-- Migration: Adicionar novos campos de cadastro de clientes
-- Data: 2026-02-27
-- Descrição: Inclui inscrições, complemento de endereço, cargo do contato e endereço da obra

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(50),
ADD COLUMN IF NOT EXISTS inscricao_municipal VARCHAR(50),
ADD COLUMN IF NOT EXISTS endereco_complemento TEXT,
ADD COLUMN IF NOT EXISTS contato_cargo VARCHAR(100),
ADD COLUMN IF NOT EXISTS endereco_obra TEXT;

COMMENT ON COLUMN clientes.inscricao_estadual IS 'Inscrição estadual da empresa cliente (opcional)';
COMMENT ON COLUMN clientes.inscricao_municipal IS 'Inscrição municipal da empresa cliente (opcional)';
COMMENT ON COLUMN clientes.endereco_complemento IS 'Complemento do endereço da empresa cliente';
COMMENT ON COLUMN clientes.contato_cargo IS 'Cargo da pessoa de contato do cliente';
COMMENT ON COLUMN clientes.endereco_obra IS 'Endereço da obra principal vinculada ao cliente';

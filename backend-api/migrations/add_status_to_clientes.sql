-- Adicionar campo status na tabela clientes
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna status com valor padrão 'ativo'
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';

-- Atualizar registros existentes para ter status 'ativo' se estiverem NULL
UPDATE clientes 
SET status = 'ativo' 
WHERE status IS NULL;

-- Adicionar constraint para valores válidos
ALTER TABLE clientes 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('ativo', 'inativo', 'bloqueado', 'pendente'));

-- Criar índice para melhor performance nas consultas por status
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);

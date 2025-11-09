-- Migration: Adicionar campos para WhatsApp em aprovações
-- Data: 2025-01-31

-- Adicionar coluna token_aprovacao em aprovacoes_horas_extras
ALTER TABLE aprovacoes_horas_extras 
ADD COLUMN IF NOT EXISTS token_aprovacao VARCHAR(255);

-- Criar índice único para token_aprovacao (para busca rápida e validação)
CREATE INDEX IF NOT EXISTS idx_aprovacoes_token ON aprovacoes_horas_extras(token_aprovacao);

-- Adicionar coluna telefone_whatsapp em funcionarios (se não existir)
-- Nota: A tabela funcionarios já tem campo telefone, mas vamos adicionar telefone_whatsapp específico
ALTER TABLE funcionarios 
ADD COLUMN IF NOT EXISTS telefone_whatsapp VARCHAR(20);

-- Comentários nas colunas
COMMENT ON COLUMN aprovacoes_horas_extras.token_aprovacao IS 'Token único e seguro para acesso público à aprovação (expira em 48h)';
COMMENT ON COLUMN funcionarios.telefone_whatsapp IS 'Telefone WhatsApp do funcionário (formato: 5511999999999)';


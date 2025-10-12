-- =====================================================
-- Migration: Create email_configs table
-- Descrição: Tabela para armazenar configurações SMTP/Email do sistema
-- Data: 11/01/2025
-- =====================================================

-- Criar tabela de configurações de email
CREATE TABLE IF NOT EXISTS email_configs (
  id BIGSERIAL PRIMARY KEY,
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT FALSE,
  smtp_user TEXT NOT NULL, -- Criptografado
  smtp_pass TEXT NOT NULL, -- Criptografado
  email_from VARCHAR(255) NOT NULL,
  email_from_name VARCHAR(255) NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  
  -- Foreign keys
  CONSTRAINT fk_email_configs_updated_by 
    FOREIGN KEY (updated_by) 
    REFERENCES usuarios(id) 
    ON DELETE SET NULL
);

-- Comentários
COMMENT ON TABLE email_configs IS 'Configurações SMTP para envio de emails (credenciais criptografadas)';
COMMENT ON COLUMN email_configs.smtp_host IS 'Host do servidor SMTP';
COMMENT ON COLUMN email_configs.smtp_port IS 'Porta do servidor SMTP';
COMMENT ON COLUMN email_configs.smtp_secure IS 'Se deve usar SSL/TLS';
COMMENT ON COLUMN email_configs.smtp_user IS 'Usuário SMTP (criptografado com AES-256)';
COMMENT ON COLUMN email_configs.smtp_pass IS 'Senha SMTP (criptografada com AES-256)';
COMMENT ON COLUMN email_configs.email_from IS 'Email remetente';
COMMENT ON COLUMN email_configs.email_from_name IS 'Nome do remetente';
COMMENT ON COLUMN email_configs.email_enabled IS 'Master switch - ativa/desativa envio de emails';
COMMENT ON COLUMN email_configs.updated_by IS 'ID do usuário que fez a última atualização';


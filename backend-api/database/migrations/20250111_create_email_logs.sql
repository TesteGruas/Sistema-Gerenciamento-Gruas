-- =====================================================
-- Migration: Create email_logs table
-- Descrição: Tabela para histórico de emails enviados
-- Data: 11/01/2025
-- =====================================================

-- Criar tabela de logs de email
CREATE TABLE IF NOT EXISTS email_logs (
  id BIGSERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  destinatario VARCHAR(255) NOT NULL,
  assunto VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  erro TEXT,
  tentativas INTEGER DEFAULT 1,
  enviado_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_email_logs_status 
    CHECK (status IN ('enviado', 'falha', 'pendente')),
  CONSTRAINT chk_email_logs_tipo
    CHECK (tipo IN ('welcome', 'reset_password', 'password_changed', 'test', 'custom'))
);

-- Criar índices para performance
CREATE INDEX idx_email_logs_destinatario ON email_logs(destinatario);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX idx_email_logs_tipo ON email_logs(tipo);
CREATE INDEX idx_email_logs_enviado_em ON email_logs(enviado_em);

-- Comentários
COMMENT ON TABLE email_logs IS 'Histórico de todos os emails enviados pelo sistema';
COMMENT ON COLUMN email_logs.tipo IS 'Tipo do email: welcome, reset_password, password_changed, test, custom';
COMMENT ON COLUMN email_logs.destinatario IS 'Email do destinatário';
COMMENT ON COLUMN email_logs.assunto IS 'Assunto do email';
COMMENT ON COLUMN email_logs.status IS 'Status do envio: enviado, falha, pendente';
COMMENT ON COLUMN email_logs.erro IS 'Mensagem de erro caso o envio tenha falhado';
COMMENT ON COLUMN email_logs.tentativas IS 'Número de tentativas de envio';
COMMENT ON COLUMN email_logs.enviado_em IS 'Data e hora do envio bem-sucedido';


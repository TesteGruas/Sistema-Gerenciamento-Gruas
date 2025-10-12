-- =====================================================
-- Migration: Create password_reset_tokens table
-- Descrição: Tabela para armazenar tokens de redefinição de senha
-- Data: 11/01/2025
-- =====================================================

-- Criar tabela de tokens de redefinição de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_password_reset_tokens_usuario 
    FOREIGN KEY (usuario_id) 
    REFERENCES usuarios(id) 
    ON DELETE CASCADE
);

-- Criar índices para performance
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX idx_password_reset_tokens_usuario_id ON password_reset_tokens(usuario_id);

-- Comentários
COMMENT ON TABLE password_reset_tokens IS 'Tokens de redefinição de senha de usuários';
COMMENT ON COLUMN password_reset_tokens.usuario_id IS 'ID do usuário que solicitou a redefinição';
COMMENT ON COLUMN password_reset_tokens.email IS 'Email do usuário';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token hash (SHA-256) para redefinição de senha';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data de expiração do token';
COMMENT ON COLUMN password_reset_tokens.used IS 'Indica se o token já foi usado';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Data em que o token foi usado';


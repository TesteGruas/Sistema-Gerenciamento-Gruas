-- =====================================================
-- Migration: Add Debug Mode Configuration
-- Descrição: Adiciona configuração para ativar/desativar modo debug no sistema
-- Data: 02/02/2025
-- =====================================================

-- Criar tabela de configurações se não existir
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice único na chave se não existir
CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);

-- Inserir configuração de debug mode (se não existir)
INSERT INTO configuracoes (chave, valor, descricao, tipo)
VALUES (
  'debug_mode_enabled',
  'false',
  'Ativa/desativa funções de debug (preenchimento automático de formulários) no sistema. Apenas administradores podem ver e usar essas funções.',
  'boolean'
)
ON CONFLICT (chave) DO NOTHING;

-- Comentários
COMMENT ON TABLE configuracoes IS 'Tabela de configurações do sistema';
COMMENT ON COLUMN configuracoes.chave IS 'Chave única da configuração';
COMMENT ON COLUMN configuracoes.valor IS 'Valor da configuração (string, boolean, number)';
COMMENT ON COLUMN configuracoes.descricao IS 'Descrição do que a configuração faz';
COMMENT ON COLUMN configuracoes.tipo IS 'Tipo da configuração: string, boolean, number';


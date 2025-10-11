-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  link VARCHAR(500),
  icone VARCHAR(100),
  destinatarios JSONB DEFAULT '[]'::jsonb,
  remetente VARCHAR(255),
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT check_tipo CHECK (tipo IN (
    'info', 'warning', 'error', 'success', 
    'grua', 'obra', 'financeiro', 'rh', 'estoque'
  ))
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data ON notificacoes(data DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida ON notificacoes(usuario_id, lida);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_notificacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notificacoes_updated_at
  BEFORE UPDATE ON notificacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_notificacoes_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE notificacoes IS 'Tabela de notificações do sistema';
COMMENT ON COLUMN notificacoes.id IS 'Identificador único da notificação';
COMMENT ON COLUMN notificacoes.titulo IS 'Título da notificação';
COMMENT ON COLUMN notificacoes.mensagem IS 'Mensagem detalhada da notificação';
COMMENT ON COLUMN notificacoes.tipo IS 'Tipo da notificação: info, warning, error, success, grua, obra, financeiro, rh, estoque';
COMMENT ON COLUMN notificacoes.lida IS 'Indica se a notificação foi lida';
COMMENT ON COLUMN notificacoes.data IS 'Data e hora da notificação';
COMMENT ON COLUMN notificacoes.destinatarios IS 'Array de destinatários em formato JSON';
COMMENT ON COLUMN notificacoes.remetente IS 'Nome de quem criou a notificação';
COMMENT ON COLUMN notificacoes.usuario_id IS 'ID do usuário destinatário';


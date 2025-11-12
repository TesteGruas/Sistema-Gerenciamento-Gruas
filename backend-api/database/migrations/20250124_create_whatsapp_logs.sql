-- =====================================================
-- Migration: Create whatsapp_logs table
-- Descrição: Tabela para histórico de mensagens WhatsApp enviadas via n8n
-- Data: 24/01/2025
-- =====================================================

-- Criar tabela de logs de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL DEFAULT 'notificacao',
  telefone_destino VARCHAR(20) NOT NULL,
  mensagem TEXT,
  aprovacao_id UUID REFERENCES aprovacoes_horas_extras(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'enviado',
  erro_detalhes TEXT,
  tentativas INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_whatsapp_logs_status 
    CHECK (status IN ('enviado', 'entregue', 'lido', 'erro', 'falha', 'pendente')),
  CONSTRAINT chk_whatsapp_logs_tipo
    CHECK (tipo IN ('notificacao', 'aprovacao', 'lembrete', 'nova_obra', 'novo_usuario', 'resultado'))
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_telefone_destino ON whatsapp_logs(telefone_destino);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_tipo ON whatsapp_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_aprovacao_id ON whatsapp_logs(aprovacao_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs(created_at);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_whatsapp_logs_updated_at
  BEFORE UPDATE ON whatsapp_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_logs_updated_at();

-- Comentários
COMMENT ON TABLE whatsapp_logs IS 'Histórico de todas as mensagens WhatsApp enviadas via n8n';
COMMENT ON COLUMN whatsapp_logs.tipo IS 'Tipo da notificação: notificacao, aprovacao, lembrete, nova_obra, novo_usuario, resultado';
COMMENT ON COLUMN whatsapp_logs.telefone_destino IS 'Telefone do destinatário (formato: código país + DDD + número)';
COMMENT ON COLUMN whatsapp_logs.mensagem IS 'Conteúdo da mensagem enviada';
COMMENT ON COLUMN whatsapp_logs.aprovacao_id IS 'ID da aprovação relacionada (se aplicável)';
COMMENT ON COLUMN whatsapp_logs.status IS 'Status do envio: enviado, entregue, lido, erro, falha, pendente';
COMMENT ON COLUMN whatsapp_logs.erro_detalhes IS 'Detalhes do erro caso o envio tenha falhado';
COMMENT ON COLUMN whatsapp_logs.tentativas IS 'Número de tentativas de envio';


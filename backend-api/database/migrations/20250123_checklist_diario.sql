-- Migration: Criar tabelas para checklist diário
-- Data: 2025-01-23

-- Criar tabela checklists_modelos
CREATE TABLE IF NOT EXISTS checklists_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para checklists_modelos
CREATE INDEX IF NOT EXISTS idx_checklists_modelos_obra_id ON checklists_modelos(obra_id);
CREATE INDEX IF NOT EXISTS idx_checklists_modelos_ativo ON checklists_modelos(ativo);

-- Criar trigger para atualizar updated_at em checklists_modelos
CREATE OR REPLACE FUNCTION update_checklists_modelos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_checklists_modelos_updated_at
  BEFORE UPDATE ON checklists_modelos
  FOR EACH ROW
  EXECUTE FUNCTION update_checklists_modelos_updated_at();

-- Criar tabela checklist_itens
CREATE TABLE IF NOT EXISTS checklist_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id UUID NOT NULL REFERENCES checklists_modelos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  obrigatorio BOOLEAN DEFAULT FALSE,
  permite_anexo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para checklist_itens
CREATE INDEX IF NOT EXISTS idx_checklist_itens_modelo_id ON checklist_itens(modelo_id);
CREATE INDEX IF NOT EXISTS idx_checklist_itens_ordem ON checklist_itens(modelo_id, ordem);

-- Criar trigger para atualizar updated_at em checklist_itens
CREATE OR REPLACE FUNCTION update_checklist_itens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_checklist_itens_updated_at
  BEFORE UPDATE ON checklist_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_checklist_itens_updated_at();

-- Criar tabela checklists_diarios
CREATE TABLE IF NOT EXISTS checklists_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  modelo_id UUID NOT NULL REFERENCES checklists_modelos(id),
  data DATE NOT NULL,
  responsavel_id INTEGER NOT NULL REFERENCES funcionarios(id),
  horario_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assinatura_digital TEXT,
  status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para checklists_diarios
CREATE INDEX IF NOT EXISTS idx_checklists_diarios_obra_id ON checklists_diarios(obra_id);
CREATE INDEX IF NOT EXISTS idx_checklists_diarios_modelo_id ON checklists_diarios(modelo_id);
CREATE INDEX IF NOT EXISTS idx_checklists_diarios_data ON checklists_diarios(data);
CREATE INDEX IF NOT EXISTS idx_checklists_diarios_responsavel_id ON checklists_diarios(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_checklists_diarios_status ON checklists_diarios(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_checklists_diarios_obra_data_modelo_unique ON checklists_diarios(obra_id, data, modelo_id);

-- Criar trigger para atualizar updated_at em checklists_diarios
CREATE OR REPLACE FUNCTION update_checklists_diarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_checklists_diarios_updated_at
  BEFORE UPDATE ON checklists_diarios
  FOR EACH ROW
  EXECUTE FUNCTION update_checklists_diarios_updated_at();

-- Criar tabela checklist_respostas
CREATE TABLE IF NOT EXISTS checklist_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists_diarios(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES checklist_itens(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('ok', 'nao_conforme', 'nao_aplicavel')),
  observacao TEXT,
  plano_acao TEXT,
  responsavel_correcao_id INTEGER REFERENCES funcionarios(id),
  prazo_correcao DATE,
  status_correcao VARCHAR(20) DEFAULT 'pendente' CHECK (status_correcao IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para checklist_respostas
CREATE INDEX IF NOT EXISTS idx_checklist_respostas_checklist_id ON checklist_respostas(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_respostas_item_id ON checklist_respostas(item_id);
CREATE INDEX IF NOT EXISTS idx_checklist_respostas_status ON checklist_respostas(status);
CREATE INDEX IF NOT EXISTS idx_checklist_respostas_status_correcao ON checklist_respostas(status_correcao);
CREATE UNIQUE INDEX IF NOT EXISTS idx_checklist_respostas_checklist_item_unique ON checklist_respostas(checklist_id, item_id);

-- Criar trigger para atualizar updated_at em checklist_respostas
CREATE OR REPLACE FUNCTION update_checklist_respostas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_checklist_respostas_updated_at
  BEFORE UPDATE ON checklist_respostas
  FOR EACH ROW
  EXECUTE FUNCTION update_checklist_respostas_updated_at();

-- Criar tabela checklist_anexos
CREATE TABLE IF NOT EXISTS checklist_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resposta_id UUID NOT NULL REFERENCES checklist_respostas(id) ON DELETE CASCADE,
  arquivo VARCHAR(500) NOT NULL,
  tipo VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para checklist_anexos
CREATE INDEX IF NOT EXISTS idx_checklist_anexos_resposta_id ON checklist_anexos(resposta_id);

-- Comentários nas tabelas
COMMENT ON TABLE checklists_modelos IS 'Modelos de checklist configurados por obra';
COMMENT ON TABLE checklist_itens IS 'Itens de verificação dos modelos de checklist';
COMMENT ON TABLE checklists_diarios IS 'Checklists diários preenchidos por obra';
COMMENT ON TABLE checklist_respostas IS 'Respostas dos itens do checklist com controle de não conformidades';
COMMENT ON TABLE checklist_anexos IS 'Anexos (fotos, documentos) vinculados às respostas do checklist';

